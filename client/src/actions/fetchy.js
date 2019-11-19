export function urlencode(params) {
  let string = "";
  Object.entries(params).forEach(([k, v]) => string += `&${k}=${v}`);
  return string;
}

export function handleErrors(response) {
  if (response.ok)
    return response;

    throw Error(response.status === 401 ? "invalid session": response.statusText);
}
