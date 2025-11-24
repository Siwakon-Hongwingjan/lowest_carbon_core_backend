export function success<T>(data: T, message = "Success") {
  return {
    status: "success",
    message,
    data,
  };
}

export function error(message: string, code = 500) {
  return {
    status: "error",
    message,
    code,
  };
}