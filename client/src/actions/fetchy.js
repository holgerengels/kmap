export function handleErrors(response) {
  if (response.ok)
    return response;

    throw Error(response.status === 401 ? "invalid session": response.statusText);
}
