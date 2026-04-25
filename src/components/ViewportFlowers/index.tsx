import React from 'react'

export function ViewportFlowers() {
  return (
    <div className="viewportFlowerField">
      <div
        className="viewportFlower viewportFlower--mid-right"
        style={
          {
            '--flower-center': 'var(--flower-gold-core)',
            '--flower-opacity': 0.85,
            '--flower-petal': 'var(--flower-gold-petal)',
            '--flower-rotation': '-8deg',
            '--flower-size': 'clamp(4rem, 8.5vw, 5.5rem)',
            '--flower-stem': 'var(--flower-grass-shadow)',
          } as React.CSSProperties
        }
      >
        <div className="viewportFlowerStem" />
        <div className="viewportFlowerBloom">
          <div className="viewportFlowerPetal viewportFlowerPetal--north" />
          <div className="viewportFlowerPetal viewportFlowerPetal--north-east" />
          <div className="viewportFlowerPetal viewportFlowerPetal--east" />
          <div className="viewportFlowerPetal viewportFlowerPetal--south-east" />
          <div className="viewportFlowerPetal viewportFlowerPetal--south" />
          <div className="viewportFlowerPetal viewportFlowerPetal--south-west" />
          <div className="viewportFlowerPetal viewportFlowerPetal--west" />
          <div className="viewportFlowerPetal viewportFlowerPetal--north-west" />
          <div className="viewportFlowerCenter" />
        </div>
      </div>
    </div>
  )
}
