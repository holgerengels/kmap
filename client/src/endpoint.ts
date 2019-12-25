import {State} from "./rdxstore";

export const endpoint = {
  get(state: State): RequestInit {
    return {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "include",
      headers: new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "X-Instance": "lala", // state.app.instance,
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
        "X-Instance": "lala", // state.app.instance,
      })
    };
  },
};
