interface Props {
  value: number       // 0–100
  color?: string
  height?: number
}

export default function ProgressBar({ value, color = 'var(--teal)', height = 8 }: Props) {
  return (
    <div style={{
      height, background: 'rgba(0,0,0,.08)',
      borderRadius: height, overflow: 'hidden'
    }}>
      <div style={{
        height: '100%', width: `${Math.min(100, Math.max(0, value))}%`,
        background: color, borderRadius: height,
        transition: 'width .5s ease',
      }} />
    </div>
  )
}
