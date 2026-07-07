type CrudMode = "create" | "update";

type PendingLabelOptions = {
  pending: boolean;
  pendingLabel: string;
  idleLabel: string;
};

export function pendingLabel({ pending, pendingLabel, idleLabel }: PendingLabelOptions) {
  return pending ? pendingLabel : idleLabel;
}

export function pendingCrudLabel(
  pending: boolean,
  mode: CrudMode,
  noun: string,
  pendingVerb = "Saving"
) {
  if (pending) {
    return `${pendingVerb}...`;
  }

  return mode === "update" ? `Update ${noun}` : `Create ${noun}`;
}
