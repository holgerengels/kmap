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
};
