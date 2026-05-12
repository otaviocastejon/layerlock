export function violationSummary(params: {
  fromLayer: string;
  toLayer: string;
  specifier: string;
}): string {
  return `Layer "${params.fromLayer}" cannot depend on "${params.toLayer}" (import "${params.specifier}").`;
}

export function violationHint(params: {
  fromLayer: string;
  toLayer: string;
}): string {
  return [
    `Break the edge from "${params.fromLayer}" to "${params.toLayer}".`,
    `Typical fixes: move shared types or port interfaces inward; use dependency inversion (domain defines a port, infrastructure implements it); extract a small neutral module; or relax layerlock.config if the coupling is intentional.`,
  ].join(" ");
}
