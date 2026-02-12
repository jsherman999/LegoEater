type SetFormProps = {
  setNum: string;
};

export function SetForm({ setNum }: SetFormProps) {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
      Set <strong>{setNum}</strong> identified. Inventory add form will be connected in Phase 3.
    </div>
  );
}
