import {State} from "./store";

export const endpoint = {
  get(state: State): RequestInit {
    return {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "X-Instance": state.app.instance,
      })
    };
  },
  post(state: State): RequestInit {
    return {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "X-Instance": state.app.instance,
      })
    };
  },
  postFormData(state: State): RequestInit {
    return {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: new Headers({
        "X-Instance": state.app.instance,
      })
    };
  },
};
export async function fetchjson(input: RequestInfo, init: RequestInit,
                             success: (Response) => void,
                             handleError: (Error) => void,
                             error: (string) => void)
{
  try {
    const resp = await fetch(input, init);
    console.log(resp.headers);
    if (resp.ok) {
      const json = await resp.json();
      success(json);
    }
    else {
      const message = await resp.text();
      handleError({code: resp.status, message: message});
      error(message);
    }
  }
  catch (e) {
    handleError({code: 500, message: e.message});
    error(e.message);
  }
}
export async function fetchblob(input: RequestInfo, init: RequestInit,
                             success: (Response) => void,
                             handleError: (Error) => void,
                             error: (string) => void)
{
  try {
    const resp = await fetch(input, init);
    if (resp.ok) {
      const blob: Blob = await resp.blob();
      success(blob);
    }
    else {
      const message = await resp.text();
      handleError({code: resp.status, message: message});
      error(message);
    }
  }
  catch (e) {
    handleError({code: 500, message: e.message});
    error(e.message);
  }
}
