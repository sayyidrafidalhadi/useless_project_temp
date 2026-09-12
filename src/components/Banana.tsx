import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

type BananaProps = {
  progress?: number;
  size?: number;
  revealed?: boolean;
};

const INK = '#594322';
const BODY = 'M 210 66 C 244 147 209 243 117 276 C 85 286 56 274 42 250 C 110 259 162 205 182 140 C 191 111 193 85 191 66 Z';

function BananaSkin() {
  return (
    <G stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d={BODY} fill="#F8D348" />
      <Path
        d="M 209 77 C 224 151 190 227 126 255 C 100 267 78 269 59 260 C 95 279 122 265 148 252 C 208 214 231 138 209 77 Z"
        fill="#EFBF31"
        stroke="none"
      />
      <Path
        d="M 200 86 C 205 137 176 211 130 238"
        fill="none"
        stroke="#FFEB83"
        strokeWidth={9}
      />
      <Path
        d="M 214 97 C 222 166 182 243 115 262"
        fill="none"
        stroke="#B98D26"
        strokeWidth={1.7}
      />
      <Path d="M 191 68 L 188 45 Q 197 40 210 45 L 210 66 Z" fill="#B7AF55" />
      <Path d="M 189 46 Q 199 50 210 46 L 209 39 Q 197 35 188 40 Z" fill="#79542E" />
      <Path d="M 42 250 Q 38 249 37 253 L 43 263 Q 47 267 53 262 L 56 258 Z" fill="#79542E" />
      <Path d="M 198 52 L 200 62" fill="none" stroke="#DDD186" strokeWidth={2} />
      <Ellipse cx={126} cy={259} rx={1.3} ry={2.1} fill="#B18A31" stroke="none" />
      <Circle cx={132} cy={254} r={1.3} fill="#B18A31" stroke="none" />
      <Circle cx={206} cy={124} r={1.3} fill="#B18A31" stroke="none" />
    </G>
  );
}

function Face() {
  return (
    <G stroke={INK} strokeWidth={2.7} strokeLinecap="round" fill="none">
      <Path d="M 159 213 L 164 215 M 177 206 L 182 208" />
      <Path d="M 169 222 Q 176 225 178 217" />
      <Ellipse cx={158} cy={221} rx={4.5} ry={2.5} fill="#EEA45D" opacity={0.45} stroke="none" />
      <Ellipse cx={186} cy={212} rx={4.5} ry={2.5} fill="#EEA45D" opacity={0.45} stroke="none" />
    </G>
  );
}

// Approximate the two sides of the fruit at the moving peel seam.
const SEAM_POINTS = [
  [38, 191, 210],
  [66, 191, 210],
  [100, 190, 220],
  [140, 182, 222],
  [180, 164, 208],
  [220, 137, 184],
  [245, 106, 160],
];

function seamAt(y: number) {
  for (let index = 1; index < SEAM_POINTS.length; index += 1) {
    const [endY, endLeft, endRight] = SEAM_POINTS[index];
    if (y <= endY) {
      const [startY, startLeft, startRight] = SEAM_POINTS[index - 1];
      const amount = (y - startY) / (endY - startY);
      return [startLeft + (endLeft - startLeft) * amount, startRight + (endRight - startRight) * amount];
    }
  }
  return [106, 160];
}

/** The more you peel, the closer you get to… another banana. */
export function Banana({ progress = 0, size = 300, revealed = false }: BananaProps) {
  const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `banana-peel-${uniqueId}`;
  const amount = revealed ? 1 : Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const seamY = 38 + amount * 207;
  const [left, right] = seamAt(seamY);
  const opening = amount * amount;
  const flapOpacity = Math.min(1, amount * 8);

  return (
    <Svg
      width={size}
      height={size * 1.125}
      viewBox="0 0 320 360"
    >
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={0} y={amount === 0 ? 0 : seamY} width={320} height={360} />
        </ClipPath>
      </Defs>

      <Ellipse cx={155} cy={325} rx={72 + opening * 14} ry={9} fill="#C9B66B" opacity={0.15} />
      <Ellipse cx={155} cy={325} rx={45} ry={5} fill="#C9B66B" opacity={0.12} />

      {!revealed && (
        <G stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <Path d={BODY} fill="#FFF0B4" />
          <Path
            d="M 205 80 C 219 148 182 224 132 249"
            fill="none"
            stroke="#FFF9DA"
            strokeWidth={10}
          />
          <Path
            d="M 213 99 C 220 161 186 226 148 249"
            fill="none"
            stroke="#DDCA8B"
            strokeWidth={1.7}
          />
        </G>
      )}

      <G clipPath={`url(#${clipId})`}>
        <BananaSkin />
      </G>

      {revealed ? (
        <G transform="translate(41 48) scale(0.8)">
          <BananaSkin />
          <Face />
        </G>
      ) : (
        <Face />
      )}

      {amount > 0 && (
        <G opacity={flapOpacity} stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <Path
            d={`M ${left} ${seamY}
              C ${left - 28 * opening} ${seamY + 17 * opening}, ${left - 71 * opening} ${seamY + 12 * opening}, ${left - 82 * opening} ${seamY + 48 * opening}
              C ${left - 41 * opening} ${seamY + 35 * opening}, ${left - 17 * opening} ${seamY + 70 * opening}, ${left + 21 * opening} ${seamY + 18 * opening}
              Q ${left + 14 * opening} ${seamY + 4 * opening}, ${left} ${seamY} Z`}
            fill="#F8D348"
          />
          <Path
            d={`M ${left + 2 * opening} ${seamY + 6 * opening} Q ${left - 40 * opening} ${seamY + 38 * opening}, ${left - 72 * opening} ${seamY + 43 * opening}`}
            fill="none"
            stroke="#C3962D"
            strokeWidth={1.8}
          />
          <Path
            d={`M ${right} ${seamY}
              C ${right + 34 * opening} ${seamY - 3 * opening}, ${right + 74 * opening} ${seamY + 14 * opening}, ${right + 96 * opening} ${seamY + 58 * opening}
              C ${right + 58 * opening} ${seamY + 39 * opening}, ${right + 34 * opening} ${seamY + 58 * opening}, ${right - 15 * opening} ${seamY + 21 * opening}
              Q ${right - 18 * opening} ${seamY + 9 * opening}, ${right} ${seamY} Z`}
            fill="#F8D348"
          />
          <Path
            d={`M ${right - 5 * opening} ${seamY + 8 * opening} Q ${right + 38 * opening} ${seamY + 13 * opening}, ${right + 86 * opening} ${seamY + 51 * opening}`}
            fill="none"
            stroke="#FFF0A0"
            strokeWidth={5}
          />
          <Path
            d={`M ${right - 3 * opening} ${seamY + 16 * opening} Q ${right + 42 * opening} ${seamY + 32 * opening}, ${right + 86 * opening} ${seamY + 51 * opening}`}
            fill="none"
            stroke="#C3962D"
            strokeWidth={1.8}
          />
        </G>
      )}

      <G stroke="#C9AE4E" strokeWidth={2} strokeLinecap="round" opacity={0.8}>
        <Path d="M 68 111 L 68 123 M 62 117 L 74 117" />
        <Path d="M 259 189 L 259 197 M 255 193 L 263 193" />
      </G>
      <Circle cx={107} cy={64} r={2.5} fill="#D7BF62" opacity={0.7} />
      <Circle cx={267} cy={119} r={2} fill="#D7BF62" opacity={0.7} />
    </Svg>
  );
}
