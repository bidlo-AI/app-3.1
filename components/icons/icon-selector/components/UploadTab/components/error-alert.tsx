export function ErrorAlert({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="mt-2 rounded-md border border-destructive bg-destructive/10 p-2 text-xs text-destructive"
      role="alert"
    >
      {message}
    </div>
  );
}
