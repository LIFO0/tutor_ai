export function PizzaFractionFigure() {
  return (
    <svg viewBox="0 0 320 220" className="mx-auto h-auto w-full max-w-md" role="img" aria-label="Пицца, разделённая на 8 частей, три закрашены">
      <circle cx="110" cy="110" r="90" fill="#FED7AA" stroke="#EA580C" strokeWidth="3" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a1 = (i * Math.PI) / 4 - Math.PI / 2;
        const a2 = ((i + 1) * Math.PI) / 4 - Math.PI / 2;
        const x1 = 110 + 90 * Math.cos(a1);
        const y1 = 110 + 90 * Math.sin(a1);
        const x2 = 110 + 90 * Math.cos(a2);
        const y2 = 110 + 90 * Math.sin(a2);
        const filled = i < 3;
        return (
          <path
            key={i}
            d={`M110 110 L${x1} ${y1} A90 90 0 0 1 ${x2} ${y2} Z`}
            fill={filled ? "#FB923C" : "#FFEDD5"}
            stroke="#EA580C"
            strokeWidth="2"
          />
        );
      })}
      <text x="220" y="90" className="fill-foreground text-2xl font-bold">
        3/8
      </text>
      <text x="220" y="120" className="fill-muted-foreground text-sm">
        3 куска из 8
      </text>
    </svg>
  );
}

export function MixedNumberLineFigure() {
  return (
    <svg viewBox="0 0 420 120" className="mx-auto h-auto w-full max-w-lg" role="img" aria-label="Числовая прямая: смешанное число 2 и 3/4">
      <line x1="30" y1="60" x2="390" y2="60" stroke="currentColor" strokeWidth="3" className="text-foreground" />
      {[0, 1, 2, 3].map((n) => {
        const x = 50 + n * 100;
        return (
          <g key={n}>
            <line x1={x} y1="48" x2={x} y2="72" stroke="currentColor" strokeWidth="3" />
            <text x={x} y="95" textAnchor="middle" className="fill-foreground text-sm font-semibold">
              {n}
            </text>
          </g>
        );
      })}
      {[0, 1, 2].map((seg) =>
        [1, 2, 3].map((q) => {
          const x = 50 + seg * 100 + q * 25;
          return <line key={`${seg}-${q}`} x1={x} y1="54" x2={x} y2="66" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />;
        }),
      )}
      <circle cx={50 + 2 * 100 + 75} cy="60" r="8" className="fill-primary" />
      <text x={50 + 2 * 100 + 75} y="30" textAnchor="middle" className="fill-primary text-sm font-bold">
        2¾
      </text>
    </svg>
  );
}

export function DecimalShiftFigure() {
  return (
    <svg viewBox="0 0 440 160" className="mx-auto h-auto w-full max-w-lg" role="img" aria-label="Перенос запятой при делении десятичных дробей">
      <text x="20" y="40" className="fill-foreground text-lg font-semibold">
        12,48 ÷ 0,6
      </text>
      <text x="20" y="80" className="fill-muted-foreground text-sm">
        умножим оба числа на 10 →
      </text>
      <text x="20" y="120" className="fill-primary text-xl font-bold">
        124,8 ÷ 6 = 20,8
      </text>
      <path d="M250 55 H380" stroke="currentColor" strokeWidth="3" className="text-primary" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-primary" />
        </marker>
      </defs>
      <text x="260" y="45" className="fill-primary text-xs">
        запятая «убежала» вправо
      </text>
    </svg>
  );
}

export function PlaceValueTableFigure() {
  const cells = [
    ["единицы", "запятая", "десятые", "сотые", "тысячные"],
    ["3", ",", "1", "4", "2"],
  ];
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto w-full max-w-lg border-collapse text-center text-sm">
        <caption className="mb-3 text-left text-sm text-muted-foreground">Разряды числа 3,142</caption>
        <thead>
          <tr>
            {cells[0].map((h) => (
              <th key={h} className="border border-border bg-muted/50 px-2 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cells[1].map((c, i) => (
              <td key={i} className="border border-border px-2 py-3 text-lg font-bold text-primary">
                {c}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function RiverCurrentFigure() {
  return (
    <svg viewBox="0 0 440 180" className="mx-auto h-auto w-full max-w-lg" role="img" aria-label="Лодка по течению и против течения">
      <rect x="0" y="70" width="440" height="70" className="fill-sky-200" />
      <path d="M20 105 H420" stroke="#0284c7" strokeWidth="2" strokeDasharray="10 6" />
      <text x="220" y="50" textAnchor="middle" className="fill-sky-800 text-sm font-semibold">
        течение →
      </text>
      <g transform="translate(80,85)">
        <ellipse cx="30" cy="25" rx="28" ry="10" className="fill-sky-700" />
        <rect x="14" y="8" width="32" height="16" rx="3" className="fill-orange-500" />
        <text x="30" y="-5" textAnchor="middle" className="fill-foreground text-xs font-bold">
          по течению
        </text>
      </g>
      <g transform="translate(280,85)">
        <ellipse cx="30" cy="25" rx="28" ry="10" className="fill-sky-700" />
        <rect x="14" y="8" width="32" height="16" rx="3" className="fill-emerald-500" />
        <text x="30" y="-5" textAnchor="middle" className="fill-foreground text-xs font-bold">
          против
        </text>
      </g>
      <text x="110" y="165" className="fill-muted-foreground text-xs">
        Vпо = Vс + Vт
      </text>
      <text x="300" y="165" className="fill-muted-foreground text-xs">
        Vпр = Vс − Vт
      </text>
    </svg>
  );
}

export function MeetingBoatsFigure() {
  return (
    <svg viewBox="0 0 440 140" className="mx-auto h-auto w-full max-w-lg" role="img" aria-label="Два объекта движутся навстречу">
      <line x1="40" y1="80" x2="400" y2="80" stroke="currentColor" strokeWidth="2" className="text-border" />
      <circle cx="80" cy="80" r="14" className="fill-orange-500" />
      <circle cx="360" cy="80" r="14" className="fill-emerald-500" />
      <path d="M110 80 H200" stroke="#ea580c" strokeWidth="3" markerEnd="url(#arr1)" />
      <path d="M330 80 H240" stroke="#16a34a" strokeWidth="3" markerEnd="url(#arr2)" />
      <defs>
        <marker id="arr1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#ea580c" />
        </marker>
        <marker id="arr2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#16a34a" />
        </marker>
      </defs>
      <text x="220" y="40" textAnchor="middle" className="fill-foreground text-sm font-semibold">
        скорость сближения = V₁ + V₂
      </text>
      <text x="220" y="120" textAnchor="middle" className="fill-muted-foreground text-xs">
        расстояние делится на сумму скоростей
      </text>
    </svg>
  );
}

export function FactorTreeFigure() {
  return (
    <svg viewBox="0 0 360 220" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="Дерево простых множителей числа 36">
      <text x="180" y="28" textAnchor="middle" className="fill-foreground text-lg font-bold">
        36
      </text>
      <line x1="180" y1="35" x2="110" y2="70" stroke="currentColor" strokeWidth="2" />
      <line x1="180" y1="35" x2="250" y2="70" stroke="currentColor" strokeWidth="2" />
      <text x="110" y="90" textAnchor="middle" className="fill-primary text-base font-bold">
        2
      </text>
      <text x="250" y="90" textAnchor="middle" className="fill-foreground text-base font-bold">
        18
      </text>
      <line x1="250" y1="98" x2="200" y2="130" stroke="currentColor" strokeWidth="2" />
      <line x1="250" y1="98" x2="300" y2="130" stroke="currentColor" strokeWidth="2" />
      <text x="200" y="150" textAnchor="middle" className="fill-primary text-base font-bold">
        2
      </text>
      <text x="300" y="150" textAnchor="middle" className="fill-foreground text-base font-bold">
        9
      </text>
      <line x1="300" y1="158" x2="270" y2="190" stroke="currentColor" strokeWidth="2" />
      <line x1="300" y1="158" x2="330" y2="190" stroke="currentColor" strokeWidth="2" />
      <text x="270" y="210" textAnchor="middle" className="fill-primary text-base font-bold">
        3
      </text>
      <text x="330" y="210" textAnchor="middle" className="fill-primary text-base font-bold">
        3
      </text>
      <text x="60" y="210" className="fill-muted-foreground text-xs">
        36 = 2 × 2 × 3 × 3
      </text>
    </svg>
  );
}

export function NodVennFigure() {
  return (
    <svg viewBox="0 0 360 200" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="НОД как общие делители чисел 12 и 18">
      <circle cx="130" cy="100" r="70" className="fill-violet-200 stroke-violet-600" strokeWidth="3" fillOpacity="0.7" />
      <circle cx="230" cy="100" r="70" className="fill-violet-300 stroke-violet-600" strokeWidth="3" fillOpacity="0.55" />
      <text x="90" y="105" textAnchor="middle" className="fill-violet-900 text-sm font-bold">
        12
      </text>
      <text x="270" y="105" textAnchor="middle" className="fill-violet-900 text-sm font-bold">
        18
      </text>
      <text x="180" y="105" textAnchor="middle" className="fill-violet-950 text-base font-bold">
        6
      </text>
      <text x="180" y="185" textAnchor="middle" className="fill-muted-foreground text-xs">
        НОД(12, 18) = 6
      </text>
    </svg>
  );
}

export function BoxVolumeFigure() {
  return (
    <svg viewBox="0 0 340 240" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="Прямоугольный параллелепипед с рёбрами a, b, c">
      <path d="M80 60 L220 90 L220 190 L80 160 Z" className="fill-amber-200 stroke-amber-800" strokeWidth="2" />
      <path d="M80 60 L20 100 L20 200 L80 160 Z" className="fill-amber-400 stroke-amber-800" strokeWidth="2" />
      <path d="M20 200 L80 160 L220 190 L160 230 Z" className="fill-amber-500 stroke-amber-800" strokeWidth="2" />
      <text x="240" y="140" className="fill-foreground text-base font-bold">
        a
      </text>
      <text x="40" y="70" className="fill-foreground text-base font-bold">
        b
      </text>
      <text x="5" y="160" className="fill-foreground text-base font-bold">
        c
      </text>
      <text x="100" y="30" className="fill-primary text-sm font-semibold">
        V = a · b · c
      </text>
    </svg>
  );
}

export function UnitsScaleFigure() {
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto w-full max-w-md border-collapse text-sm">
        <caption className="mb-3 text-left text-sm text-muted-foreground">Полезные переводы единиц</caption>
        <thead>
          <tr className="bg-muted/50">
            <th className="border border-border px-3 py-2 text-left">Единица</th>
            <th className="border border-border px-3 py-2 text-left">Чему равна</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["1 м²", "10 000 см²"],
            ["1 ар", "100 м²"],
            ["1 га", "10 000 м² = 100 ар"],
            ["1 л", "1000 см³ = 1 дм³"],
            ["1 м³", "1000 л"],
          ].map(([a, b]) => (
            <tr key={a}>
              <td className="border border-border px-3 py-2 font-semibold text-primary">{a}</td>
              <td className="border border-border px-3 py-2">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ThermometerNumberLineFigure() {
  return (
    <svg
      viewBox="0 0 440 160"
      className="mx-auto h-auto w-full max-w-lg"
      role="img"
      aria-label="Числовая прямая с отрицательными и положительными числами"
    >
      <line x1="30" y1="80" x2="410" y2="80" stroke="currentColor" strokeWidth="3" className="text-foreground" />
      {[-4, -2, 0, 2, 4].map((n) => {
        const x = 220 + n * 40;
        return (
          <g key={n}>
            <line x1={x} y1="68" x2={x} y2="92" stroke="currentColor" strokeWidth="2" />
            <text x={x} y="115" textAnchor="middle" className="fill-foreground text-sm font-semibold">
              {n}
            </text>
          </g>
        );
      })}
      <circle cx={220 - 3 * 40} cy="80" r="8" className="fill-sky-500" />
      <text x={220 - 3 * 40} y="50" textAnchor="middle" className="fill-sky-700 text-xs font-bold">
        −3°
      </text>
      <circle cx={220 + 2 * 40} cy="80" r="8" className="fill-orange-500" />
      <text x={220 + 2 * 40} y="50" textAnchor="middle" className="fill-orange-700 text-xs font-bold">
        +2°
      </text>
      <text x="220" y="145" textAnchor="middle" className="fill-muted-foreground text-xs">
        влево — минус, вправо — плюс
      </text>
    </svg>
  );
}

export function BracketSignFlipFigure() {
  return (
    <svg
      viewBox="0 0 420 140"
      className="mx-auto h-auto w-full max-w-lg"
      role="img"
      aria-label="Минус перед скобкой меняет знаки внутри"
    >
      <text x="20" y="45" className="fill-foreground text-lg font-semibold">
        −(a − b + c)
      </text>
      <path d="M180 40 H240" stroke="currentColor" strokeWidth="3" className="text-primary" markerEnd="url(#brArr)" />
      <defs>
        <marker id="brArr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" className="fill-primary" />
        </marker>
      </defs>
      <text x="250" y="45" className="fill-primary text-lg font-bold">
        −a + b − c
      </text>
      <text x="20" y="100" className="fill-muted-foreground text-sm">
        Минус перед скобкой = все знаки внутри наоборот
      </text>
    </svg>
  );
}

export function EquationScalesFigure() {
  return (
    <svg
      viewBox="0 0 420 180"
      className="mx-auto h-auto w-full max-w-lg"
      role="img"
      aria-label="Уравнение как весы: перенос меняет знак"
    >
      <line x1="60" y1="90" x2="360" y2="90" stroke="currentColor" strokeWidth="4" className="text-foreground" />
      <line x1="210" y1="90" x2="210" y2="150" stroke="currentColor" strokeWidth="4" className="text-foreground" />
      <rect x="190" y="150" width="40" height="12" rx="2" className="fill-muted-foreground" />
      <rect x="80" y="55" width="70" height="30" rx="6" className="fill-orange-200 stroke-orange-600" strokeWidth="2" />
      <text x="115" y="75" textAnchor="middle" className="fill-orange-900 text-sm font-bold">
        5x
      </text>
      <rect x="270" y="55" width="70" height="30" rx="6" className="fill-emerald-200 stroke-emerald-600" strokeWidth="2" />
      <text x="305" y="75" textAnchor="middle" className="fill-emerald-900 text-sm font-bold">
        2x+9
      </text>
      <text x="210" y="40" textAnchor="middle" className="fill-muted-foreground text-xs">
        перенёс слагаемое → сменил знак
      </text>
    </svg>
  );
}

export function ProportionCrossFigure() {
  return (
    <svg
      viewBox="0 0 360 180"
      className="mx-auto h-auto w-full max-w-sm"
      role="img"
      aria-label="Основное свойство пропорции: крест-накрест"
    >
      <text x="80" y="50" textAnchor="middle" className="fill-foreground text-xl font-bold">
        a
      </text>
      <text x="80" y="130" textAnchor="middle" className="fill-foreground text-xl font-bold">
        b
      </text>
      <line x1="50" y1="70" x2="110" y2="70" stroke="currentColor" strokeWidth="2" />
      <text x="140" y="95" className="fill-muted-foreground text-2xl">
        =
      </text>
      <text x="220" y="50" textAnchor="middle" className="fill-foreground text-xl font-bold">
        c
      </text>
      <text x="220" y="130" textAnchor="middle" className="fill-foreground text-xl font-bold">
        d
      </text>
      <line x1="190" y1="70" x2="250" y2="70" stroke="currentColor" strokeWidth="2" />
      <line x1="90" y1="55" x2="210" y2="120" stroke="#ea580c" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="90" y1="120" x2="210" y2="55" stroke="#16a34a" strokeWidth="2" strokeDasharray="4 3" />
      <text x="280" y="95" className="fill-primary text-sm font-semibold">
        a·d = b·c
      </text>
    </svg>
  );
}

export function PercentChangeFigure() {
  return (
    <svg
      viewBox="0 0 420 140"
      className="mx-auto h-auto w-full max-w-lg"
      role="img"
      aria-label="Цена снизилась на процент, потом выросла"
    >
      <rect x="30" y="50" width="90" height="50" rx="8" className="fill-sky-100 stroke-sky-600" strokeWidth="2" />
      <text x="75" y="80" textAnchor="middle" className="fill-sky-900 text-sm font-bold">
        100%
      </text>
      <path d="M130 75 H170" stroke="#ea580c" strokeWidth="3" markerEnd="url(#pArr)" />
      <text x="150" y="45" textAnchor="middle" className="fill-orange-600 text-xs font-bold">
        −20%
      </text>
      <rect x="180" y="50" width="90" height="50" rx="8" className="fill-amber-100 stroke-amber-600" strokeWidth="2" />
      <text x="225" y="80" textAnchor="middle" className="fill-amber-900 text-sm font-bold">
        80%
      </text>
      <path d="M280 75 H320" stroke="#16a34a" strokeWidth="3" markerEnd="url(#pArr)" />
      <text x="300" y="45" textAnchor="middle" className="fill-emerald-600 text-xs font-bold">
        +15%
      </text>
      <rect x="330" y="50" width="70" height="50" rx="8" className="fill-emerald-100 stroke-emerald-600" strokeWidth="2" />
      <text x="365" y="80" textAnchor="middle" className="fill-emerald-900 text-xs font-bold">
        92%
      </text>
      <defs>
        <marker id="pArr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#334155" />
        </marker>
      </defs>
    </svg>
  );
}

export function CoordinatePlaneFigure() {
  return (
    <svg
      viewBox="0 0 320 280"
      className="mx-auto h-auto w-full max-w-sm"
      role="img"
      aria-label="Координатная плоскость с точкой (3; 2)"
    >
      <line x1="40" y1="140" x2="290" y2="140" stroke="currentColor" strokeWidth="2" className="text-foreground" />
      <line x1="160" y1="250" x2="160" y2="30" stroke="currentColor" strokeWidth="2" className="text-foreground" />
      <polygon points="290,140 278,134 278,146" className="fill-foreground" />
      <polygon points="160,30 154,42 166,42" className="fill-foreground" />
      <text x="295" y="135" className="fill-foreground text-sm font-bold">
        x
      </text>
      <text x="168" y="28" className="fill-foreground text-sm font-bold">
        y
      </text>
      {[1, 2, 3].map((n) => (
        <g key={`x${n}`}>
          <line x1={160 + n * 30} y1="134" x2={160 + n * 30} y2="146" stroke="currentColor" strokeWidth="1.5" />
          <text x={160 + n * 30} y="162" textAnchor="middle" className="fill-muted-foreground text-xs">
            {n}
          </text>
        </g>
      ))}
      {[1, 2].map((n) => (
        <g key={`y${n}`}>
          <line x1="154" y1={140 - n * 30} x2="166" y2={140 - n * 30} stroke="currentColor" strokeWidth="1.5" />
          <text x="145" y={140 - n * 30 + 4} textAnchor="end" className="fill-muted-foreground text-xs">
            {n}
          </text>
        </g>
      ))}
      <circle cx={160 + 3 * 30} cy={140 - 2 * 30} r="7" className="fill-primary" />
      <text x={160 + 3 * 30 + 12} y={140 - 2 * 30} className="fill-primary text-sm font-bold">
        (3; 2)
      </text>
      <text x="160" y="270" textAnchor="middle" className="fill-muted-foreground text-xs">
        сначала x (вправо/влево), потом y (вверх/вниз)
      </text>
    </svg>
  );
}

