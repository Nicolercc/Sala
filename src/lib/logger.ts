const redactedKeys = new Set(["firstName", "lastName", "dob", "reason"]);

export function redactPatientFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactPatientFields);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        redactedKeys.has(key) ? "[redacted]" : redactPatientFields(nestedValue)
      ])
    );
  }

  return value;
}

export const logger = {
  info(message: string, details?: unknown) {
    console.info(message, details === undefined ? undefined : redactPatientFields(details));
  },
  error(message: string, details?: unknown) {
    console.error(message, details === undefined ? undefined : redactPatientFields(details));
  }
};
