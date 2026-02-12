export function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

export function printTable(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    console.log("No results.");
    return;
  }
  console.table(rows);
}
