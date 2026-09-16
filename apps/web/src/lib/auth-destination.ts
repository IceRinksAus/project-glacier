export function getPostLoginDestination(role: string) {
  return role === "SCANNER" ? "/staff/scanner" : "/";
}
