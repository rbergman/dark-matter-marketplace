# ReScript Patterns Reference

## Variant Patterns

### State Machines

```rescript
type connectionState =
  | Disconnected
  | Connecting({attempt: int, startedAt: float})
  | Connected({sessionId: string})
  | Reconnecting({lastSession: string, attempt: int})
  | Error({message: string})

type connectionAction =
  | Connect
  | Disconnect
  | ConnectionSuccess(string)
  | ConnectionFailed(string)
  | Retry

let transition = (state: connectionState, action: connectionAction): connectionState =>
  switch (state, action) {
  | (Disconnected, Connect) =>
    Connecting({attempt: 1, startedAt: Js.Date.now()})
  | (Connecting(_), ConnectionSuccess(sessionId)) =>
    Connected({sessionId: sessionId})
  | (Connecting({attempt}), ConnectionFailed(msg)) if attempt < 3 =>
    Reconnecting({lastSession: "", attempt: attempt + 1})
  | (Connecting(_), ConnectionFailed(msg)) =>
    Error({message: msg})
  | (Connected(_), Disconnect) =>
    Disconnected
  | (Reconnecting({attempt}), Retry) if attempt < 3 =>
    Connecting({attempt: attempt + 1, startedAt: Js.Date.now()})
  | (Reconnecting(_), Retry) =>
    Error({message: "Max retries exceeded"})
  | (Error(_), Connect) =>
    Connecting({attempt: 1, startedAt: Js.Date.now()})
  | _ => state  // Ignore invalid transitions
  }
```

### Result Chaining

```rescript
type parseError = InvalidJson | MissingField(string) | InvalidType(string)

let parseUser = (json: Js.Json.t): result<user, parseError> => {
  open Result

  json
  ->Js.Json.decodeObject
  ->Option.toResult(InvalidJson)
  ->flatMap(obj => {
    let id = obj->Dict.get("id")->Option.toResult(MissingField("id"))
    let name = obj->Dict.get("name")->Option.toResult(MissingField("name"))
    let email = obj->Dict.get("email")->Option.toResult(MissingField("email"))

    switch (id, name, email) {
    | (Ok(id), Ok(name), Ok(email)) =>
      switch (
        id->Js.Json.decodeString,
        name->Js.Json.decodeString,
        email->Js.Json.decodeString,
      ) {
      | (Some(id), Some(name), Some(email)) =>
        Ok({id, name, email})
      | _ => Error(InvalidType("Expected strings"))
      }
    | (Error(e), _, _) | (_, Error(e), _) | (_, _, Error(e)) => Error(e)
    }
  })
}
```

### Polymorphic Variants for Interop

```rescript
// Use polymorphic variants for JS string enums
@module("./api")
external setLogLevel: (@unwrap [#debug | #info | #warn | #error]) => unit = "setLogLevel"

@module("./api")
external setTheme: (@unwrap [#light | #dark | #system]) => unit = "setTheme"

// Usage - type-safe string values
setLogLevel(#warn)
setTheme(#dark)

// For more complex cases with payloads
type apiResponse<'a> = [
  | #Success('a)
  | #Error(string)
  | #Loading
  | #NotFound
]

let handleResponse = (response: apiResponse<user>) =>
  switch response {
  | #Success(user) => Console.log(`Found: ${user.name}`)
  | #Error(msg) => Console.error(msg)
  | #Loading => Console.log("Loading...")
  | #NotFound => Console.log("User not found")
  }
```

## Module Patterns

### Module Functors

```rescript
// Module type for comparable items
module type Comparable = {
  type t
  let compare: (t, t) => int
}

// Generic sorted set module
module MakeSortedSet = (Item: Comparable) => {
  type t = list<Item.t>

  let empty: t = list{}

  let add = (set: t, item: Item.t): t => {
    let rec insert = (lst, item) =>
      switch lst {
      | list{} => list{item}
      | list{head, ...tail} =>
        switch Item.compare(item, head) {
        | n if n < 0 => list{item, head, ...tail}
        | 0 => lst  // Already exists
        | _ => list{head, ...insert(tail, item)}
        }
      }
    insert(set, item)
  }

  let toArray = (set: t): array<Item.t> => List.toArray(set)
}

// Usage
module IntSet = MakeSortedSet({
  type t = int
  let compare = (a, b) => a - b
})

let set = IntSet.empty->IntSet.add(3)->IntSet.add(1)->IntSet.add(2)
```

### First-Class Modules

```rescript
module type Storage = {
  let get: string => option<string>
  let set: (string, string) => unit
  let remove: string => unit
}

// Pack module as value
let localStorage: module(Storage) = module({
  @val @scope("localStorage")
  external getItem: string => Nullable.t<string> = "getItem"
  @val @scope("localStorage")
  external setItem: (string, string) => unit = "setItem"
  @val @scope("localStorage")
  external removeItem: string => unit = "removeItem"

  let get = key => getItem(key)->Nullable.toOption
  let set = setItem
  let remove = removeItem
})

// Use with any storage implementation
let saveData = (storage: module(Storage), key: string, value: string) => {
  module S = unpack(storage)
  S.set(key, value)
}
```

## FFI Patterns

### Binding to Classes

```rescript
// ES6 class binding
type websocket

@new external makeWebSocket: string => websocket = "WebSocket"
@send external send: (websocket, string) => unit = "send"
@send external close: websocket => unit = "close"
@get external readyState: websocket => int = "readyState"
@set external onmessage: (websocket, Js.Json.t => unit) => unit = "onmessage"
@set external onerror: (websocket, Js.Exn.t => unit) => unit = "onerror"

// Usage
let ws = makeWebSocket("wss://example.com/socket")
ws->onmessage(msg => Console.log2("Received:", msg))
ws->send(`{"type": "ping"}`)
```

### Binding to Object Methods

```rescript
// Object with chainable methods
type queryBuilder

@module("./db") external query: string => queryBuilder = "query"
@send external where: (queryBuilder, string, 'a) => queryBuilder = "where"
@send external orderBy: (queryBuilder, string) => queryBuilder = "orderBy"
@send external limit: (queryBuilder, int) => queryBuilder = "limit"
@send external execute: queryBuilder => promise<array<Js.Json.t>> = "execute"

// Chainable usage
let getUsers = async () => {
  query("users")
    ->where("active", true)
    ->orderBy("created_at")
    ->limit(10)
    ->execute
}
```

### Binding to Callbacks

```rescript
// Node-style callbacks
type callback<'a> = (Nullable.t<Js.Exn.t>, 'a) => unit

@module("fs")
external readFile: (string, string, callback<string>) => unit = "readFile"

// Promise wrapper
let readFileAsync = (path: string): promise<result<string, Js.Exn.t>> => {
  Promise.make((resolve, _reject) => {
    readFile(path, "utf8", (err, data) => {
      switch err->Nullable.toOption {
      | Some(e) => resolve(Error(e))
      | None => resolve(Ok(data))
      }
    })
  })
}
```

### Typed Event Handlers

```rescript
type mouseEvent = {
  clientX: int,
  clientY: int,
  button: int,
  preventDefault: unit => unit,
}

type keyboardEvent = {
  key: string,
  code: string,
  altKey: bool,
  ctrlKey: bool,
  shiftKey: bool,
  preventDefault: unit => unit,
}

@val @scope("document")
external addMouseListener: (
  @string [#click | #mousedown | #mouseup | #mousemove],
  mouseEvent => unit
) => unit = "addEventListener"

@val @scope("document")
external addKeyListener: (
  @string [#keydown | #keyup | #keypress],
  keyboardEvent => unit
) => unit = "addEventListener"

// Usage
addMouseListener(#click, event => {
  Console.log2("Clicked at:", (event.clientX, event.clientY))
})

addKeyListener(#keydown, event => {
  if event.ctrlKey && event.key == "s" {
    event.preventDefault()
    Console.log("Save shortcut pressed")
  }
})
```

## React Patterns

### Context with Variants

```rescript
type theme = Light | Dark

type themeContext = {
  theme: theme,
  toggleTheme: unit => unit,
}

let context = React.createContext({
  theme: Light,
  toggleTheme: () => (),
})

module Provider = {
  @react.component
  let make = (~children: React.element) => {
    let (theme, setTheme) = React.useState(_ => Light)

    let value = {
      theme,
      toggleTheme: () =>
        setTheme(prev =>
          switch prev {
          | Light => Dark
          | Dark => Light
          }
        ),
    }

    <context.Provider value>
      {children}
    </context.Provider>
  }
}

// Hook for consuming
let useTheme = () => React.useContext(context)
```

### Custom Hook with Cleanup

```rescript
type windowSize = {
  width: int,
  height: int,
}

let useWindowSize = (): windowSize => {
  let (size, setSize) = React.useState(_ => {
    width: Webapi.Dom.Window.innerWidth(Webapi.Dom.window),
    height: Webapi.Dom.Window.innerHeight(Webapi.Dom.window),
  })

  React.useEffect0(() => {
    let handleResize = _ => {
      setSize(_ => {
        width: Webapi.Dom.Window.innerWidth(Webapi.Dom.window),
        height: Webapi.Dom.Window.innerHeight(Webapi.Dom.window),
      })
    }

    Webapi.Dom.Window.addEventListener(Webapi.Dom.window, "resize", handleResize)

    Some(
      () =>
        Webapi.Dom.Window.removeEventListener(
          Webapi.Dom.window,
          "resize",
          handleResize,
        ),
    )
  })

  size
}
```

### Render Props / Children as Function

```rescript
type fetchState<'a> =
  | Loading
  | Success('a)
  | Error(string)

@react.component
let make = (~url: string, ~children: fetchState<Js.Json.t> => React.element) => {
  let (state, setState) = React.useState(_ => Loading)

  React.useEffect1(() => {
    let fetchData = async () => {
      try {
        let response = await fetch(url)
        let json = await response->Response.json
        setState(_ => Success(json))
      } catch {
      | _ => setState(_ => Error("Failed to fetch"))
      }
    }

    fetchData()->ignore
    None
  }, [url])

  children(state)
}

// Usage
<Fetch url="/api/users">
  {state =>
    switch state {
    | Loading => <Spinner />
    | Success(data) => <UserList data />
    | Error(msg) => <ErrorMessage message={msg} />
    }}
</Fetch>
```

## Testing Patterns

### Unit Testing with rescript-test

```rescript
open Test

describe("User module", () => {
  test("creates user with valid data", () => {
    let user = User.make(~id="123", ~name="Alice")
    expect(user.name)->toBe("Alice")
  })

  test("validates email format", () => {
    let result = User.validateEmail("invalid")
    expect(result)->toEqual(Error(InvalidEmail))
  })

  describe("authentication", () => {
    test("rejects empty password", () => {
      let result = User.authenticate(~email="test@example.com", ~password="")
      expect(result)->toEqual(Error(EmptyPassword))
    })
  })
})
```

### Property-Based Testing

```rescript
open FastCheck

// Test that reverse is involutory
test("reverse twice returns original", () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), arr => {
      arr->Array.reverse->Array.reverse == arr
    }),
  )
})

// Test sort invariants
test("sort produces ordered array", () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), arr => {
      let sorted = arr->Array.copy->Array.sort((a, b) => a - b)
      sorted->Array.everyWithIndex((v, i) =>
        i == 0 || sorted->Array.getUnsafe(i - 1) <= v
      )
    }),
  )
})
```

## Error Handling Patterns

### Railway-Oriented Programming

```rescript
module Result = {
  // Extend Result with more combinators
  let bind = (result, fn) =>
    switch result {
    | Ok(v) => fn(v)
    | Error(_) as e => e
    }

  let map2 = (r1, r2, fn) =>
    switch (r1, r2) {
    | (Ok(v1), Ok(v2)) => Ok(fn(v1, v2))
    | (Error(_) as e, _) => e
    | (_, Error(_) as e) => e
    }

  let sequence = (results: array<result<'a, 'e>>): result<array<'a>, 'e> => {
    results->Array.reduce(Ok([]), (acc, r) =>
      switch (acc, r) {
      | (Ok(arr), Ok(v)) => Ok(arr->Array.concat([v]))
      | (Error(_) as e, _) => e
      | (_, Error(_) as e) => e
      }
    )
  }
}

// Usage: compose operations that can fail
let processOrder = (orderId: string): result<receipt, orderError> => {
  orderId
  ->validateOrderId
  ->Result.bind(fetchOrder)
  ->Result.bind(validateInventory)
  ->Result.bind(processPayment)
  ->Result.bind(generateReceipt)
}
```

### Tagged Errors

```rescript
type apiError =
  | NetworkError({url: string, status: int})
  | ValidationError({field: string, message: string})
  | AuthError({reason: string})
  | RateLimited({retryAfter: int})

let errorToMessage = (error: apiError): string =>
  switch error {
  | NetworkError({url, status}) => `Network error: ${url} returned ${Int.toString(status)}`
  | ValidationError({field, message}) => `Validation failed for ${field}: ${message}`
  | AuthError({reason}) => `Authentication failed: ${reason}`
  | RateLimited({retryAfter}) => `Rate limited. Retry after ${Int.toString(retryAfter)} seconds`
  }

let errorToStatusCode = (error: apiError): int =>
  switch error {
  | NetworkError(_) => 502
  | ValidationError(_) => 400
  | AuthError(_) => 401
  | RateLimited(_) => 429
  }
```
