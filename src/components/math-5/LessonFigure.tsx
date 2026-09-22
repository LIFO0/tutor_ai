import type { ComponentType } from "react";
import {
  PizzaFractionFigure,
  MixedNumberLineFigure,
  DecimalShiftFigure,
  PlaceValueTableFigure,
  RiverCurrentFigure,
  MeetingBoatsFigure,
  FactorTreeFigure,
  NodVennFigure,
  BoxVolumeFigure,
  UnitsScaleFigure,
  ThermometerNumberLineFigure,
  BracketSignFlipFigure,
  EquationScalesFigure,
  ProportionCrossFigure,
  PercentChangeFigure,
  CoordinatePlaneFigure,
} from "@/components/math-5/figures";

const FIGURE_MAP: Record<string, ComponentType> = {
  "pizza-fraction": PizzaFractionFigure,
  "mixed-number-line": MixedNumberLineFigure,
  "decimal-shift": DecimalShiftFigure,
  "place-value-table": PlaceValueTableFigure,
  "river-current": RiverCurrentFigure,
  "meeting-boats": MeetingBoatsFigure,
  "factor-tree": FactorTreeFigure,
  "nod-venn": NodVennFigure,
  "box-volume": BoxVolumeFigure,
  "units-scale": UnitsScaleFigure,
  "thermometer-line": ThermometerNumberLineFigure,
  "bracket-sign-flip": BracketSignFlipFigure,
  "equation-scales": EquationScalesFigure,
  "proportion-cross": ProportionCrossFigure,
  "percent-change": PercentChangeFigure,
  "coordinate-plane": CoordinatePlaneFigure,
};

export function LessonFigure({ id, caption }: { id: string; caption?: string }) {
  const Comp = FIGURE_MAP[id];
  if (!Comp) return null;
  return (
    <figure className="my-8 rounded-2xl border border-border bg-muted/20 p-4 sm:p-6">
      <Comp />
      {caption ? (
        <figcaption className="mt-4 text-center text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
