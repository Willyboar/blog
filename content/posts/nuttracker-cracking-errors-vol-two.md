---
title = "Nuttracker Cracking Errors (Vol.2)"
description = "Create a test wisp app and start erlang logger"
date = "2025-11-26"
draft = false
tags = ["gleam", "programming", "tools", "nuttracker"]
---

# Nuttracker: Cracking errors (Vol.2)

Now that we made clear what we want to create let's move on to the implementation. 

The first step is to create an app with some intentional errors to test our logger. We will create a wisp application with some errors in specific routes: 

> This articles is not a tutorial but mostly a cover on the implementation of the logger and the error tracker.


`wisp_app.gleam:`
```gleam 
import gleam/erlang/process
import gleam/int
import mist
import wisp.{type Request, type Response}
import wisp/wisp_mist

pub fn main() {
  let secret_key_base = wisp.random_string(64)

  let assert Ok(_) =
    wisp_mist.handler(handle_request, secret_key_base)
    |> mist.new
    |> mist.port(8000)
    |> mist.start
  process.sleep_forever()
}

fn handle_request(req: Request) -> Response {
  use _req <- middleware(req)

  case wisp.path_segments(req) {
    [] -> home_page()
    ["panic"] -> panic_error()
    ["assert"] -> assert_error()
    ["list_error"] -> list_error()
    ["timeout"] -> timeout_error()
    _ -> not_found()
  }
}

fn middleware(req: Request, handle_request: fn(Request) -> Response) -> Response {
  let req = wisp.method_override(req)
  use <- wisp.rescue_crashes
  use req <- wisp.handle_head(req)
  use req <- wisp.csrf_known_header_protection(req)

  handle_request(req)
}
```

We created the functions `panic_error`, `assert_error`, `list_error`, `timeout_error`, and `not_found`.

```gleam 
fn panic_error() -> Response {
  panic as "This is a deliberate panic for testing!"
}

fn assert_error() -> Response {
  let assert Ok(value) = Error("Assertion failed!")
  let response_text = "Value: " <> int.to_string(value)
  wisp.ok()
  |> wisp.string_body(response_text)
}

fn list_error() -> Response {
  let empty_list = []
  let assert [first, ..] = empty_list

  wisp.ok()
  |> wisp.string_body("First element: " <> int.to_string(first))
}

fn timeout_error() -> Response {
  let subject = process.new_subject()

  let assert Ok(_) = process.receive(subject, 1)

  wisp.ok()
  |> wisp.string_body("This should never be reached")
}

fn not_found() -> Response {
  wisp.not_found()
}
```

and a basic html front end to `home_page` to trigger the errors:

``` gleam
fn home_page() -> Response {
  let html =
    "
    <!DOCTYPE html>
    <html>
      <head>
        <title>Error Test App</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #333; }
          ul { list-style: none; padding: 0; }
          li {
            margin: 10px 0;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
          }
          a {
            color: #e74c3c;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover { text-decoration: underline; }
          code {
            background: #fff;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>Nuttracker Error Test Application</h1>
        <p>Click any link below to trigger different types of errors:</p>
        <ul>
          <li><a href=\"/panic\">Panic Error</a> - <code>panic</code> statement</li>
          <li><a href=\"/assert\">Assert Error</a> - <code>let assert</code> failure</li>
          <li><a href=\"/list_error\">List Error</a> - List operation failure</li>
          <li><a href=\"/timeout\">Timeout Error</a> - Process timeout</li>
        </ul>
        <p><em>These errors are intentional for testing the error tracker!</em></p>
      </body>
    </html>
  "

  wisp.html_response(html, 200)
}
```

We didn't use wisp logger as we want to implement our own. 
Now when we get an error we get info for the **BEAM** default logger.

**BEAM** default logger output looks like this: 

```
=ERROR REPORT==== 26-Nov-2025::20:55:09.538682 ===
    function: <<"timeout_error">>
    line: 116
    message: <<"Pattern match failed, no pattern matched the value.">>
    module: <<"wisp_app">>
    start: 3001
    value: {error,nil}
    file: <<"src/wisp_app.gleam">>
    'end': 3047
    gleam_error: let_assert
    pattern_end: 3017
    pattern_start: 3012
    class: errored
```

Not bad for default but we need more info and be able to process the data. We can add more details to the error report by implementing our own logger.

So let's start:

We will create an erlang file.
`nuttracker_logger.erl:`

```erlang
-module(nuttracker_logger_handler).
-behaviour(logger_handler).

%% logger_handler callbacks
-export([log/2, adding_handler/1, removing_handler/1, changing_config/3]).

%% API
-export([install/0, uninstall/0]).

-define(HANDLER_ID, nuttracker_handler).

%% API Functions

install() ->
    Config = #{
        level => all,
        filter_default => log,
        filters => []
    },
    case logger:add_handler(?HANDLER_ID, ?MODULE, Config) of
        ok ->
            {ok, <<"NutTracker logger handler installed">>};
        {error, {already_exist, _}} ->
            {ok, <<"NutTracker logger handler already installed">>};
        {error, Reason} ->
            {error, term_to_binary(Reason)}
    end.

uninstall() ->
    case logger:remove_handler(?HANDLER_ID) of
        ok ->
            {ok, <<"NutTracker logger handler removed">>};
        {error, {not_found, _}} ->
            {ok, <<"NutTracker logger handler not found">>};
        {error, Reason} ->
            {error, term_to_binary(Reason)}
    end.

%% logger_handler Callbacks

adding_handler(Config) ->
    {ok, Config}.

removing_handler(_Config) ->
    ok.

changing_config(_SetOrUpdate, _OldConfig, NewConfig) ->
    {ok, NewConfig}.

log(LogEvent, _Config) ->
    io:format("~p~n", [LogEvent]),
    ok.
```

Here is our prototype logger handler.

It's pretty simple for now, but we can expand it to include more features and customization options in the future.

Now let's create a gleam wrapper for our logger handler.

`nuttracker.gleam:`
```gleam
import gleam/option.{type Option}

/// Represents the log level of an error event
pub type LogLevel {
  Emergency
  Alert
  Critical
  Error
  Warning
  Notice
  Info
  Debug
}

/// Represents the type of Gleam error
pub type GleamErrorType {
  Panic
  LetAssert
  Todo
  Other(String)
}

/// Represents the error class
pub type ErrorClass {
  Errored
  Exit
  Throw
  UnknownClass
}

/// Represents a captured error event with all available metadata
pub type ErrorEvent {
  ErrorEvent(
    level: LogLevel,
    message: String,
    module: Option(String),
    function: Option(String),
    file: Option(String),
    line: Option(Int),
    pid: Option(String),
    time: Option(Int),
    gleam_error: Option(GleamErrorType),
    error_class: Option(ErrorClass),
    error_reason: Option(String),
    error_value: Option(String),
    start_pos: Option(Int),
    end_pos: Option(Int),
    pattern_start: Option(Int),
    pattern_end: Option(Int),
  )
}

/// Install the NutTracker logger handler
/// Returns Ok with success message or Error if installation fails
pub fn install() -> Result(String, String) {
  do_install()
}

/// Uninstall the NutTracker logger handler
/// Returns Ok with success message or Error if removal fails
pub fn uninstall() -> Result(String, String) {
  do_uninstall()
}

// FFI functions
@external(erlang, "nuttracker_logger_handler", "install")
fn do_install() -> Result(String, String)

@external(erlang, "nuttracker_logger_handler", "uninstall")
fn do_uninstall() -> Result(String, String)
```

What we did in gleam wrapper:
- Created a `ErrorEvent` struct to represent a captured error event with all available metadata.
- Implemented `install` and `uninstall` functions to install and uninstall the NutTracker logger handler.
- Defined FFI functions for installing and uninstalling the logger handler.

Now let's use our logger handler into our wisp app.

We need to add our library as a local dependency:

```toml
nuttracker = { path = "../nuttracker" }
```
import it in our wisp app:

```gleam 
import nuttracker
```

and install it with:

```gleam
let _nuttracker = nuttracker.install()
```

If we start our wisp app and trigger an error we get this output along with the **BEAM** default:

```
#{meta => #{pid => <0.129.0>,time => 1764185331564691,gl => <0.69.0>},
  msg =>
      {report,#{function => <<"panic_error">>,line => 109,
                message => <<"This is a deliberate panic for testing!">>,
                module => <<"wisp_app">>,file => <<"src/wisp_app.gleam">>,
                gleam_error => panic,class => errored}},
  level => error}
```

It's almost identical with the **BEAM** default. The difference is now the data are stored in an erlang map so we are able to access them, manipulate them, store them to a database and generally use them depending on our needs.

In the next post we will parse the event and normalize it into Gleam types.
