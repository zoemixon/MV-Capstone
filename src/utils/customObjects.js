export const demoMolecules = [
    {
      name: "Demo Object (Water)",
      source: "custom",
      visible: true,
      labelsVisible: true,
      atoms: [
        { elem: "O", x: 0, y: 0, z: 0 },
        { elem: "H", x: 0.95, y: 0, z: 0 },
        { elem: "H", x: -0.95, y: 0, z: 0 }
      ],
      bonds: [
        { startIdx: 0, endIdx: 1 },
        { startIdx: 0, endIdx: 2 }
      ]
    },
    {
      name: "Demo Object 2 (CO₂)",
      source: "custom",
      visible: true,
      labelsVisible: true,
      atoms: [
        { elem: "C", x: 3, y: 0, z: 0 },
        { elem: "O", x: 4.16, y: 0, z: 0 },
        { elem: "O", x: 1.84, y: 0, z: 0 }
      ],
      bonds: [
        { startIdx: 0, endIdx: 1 },
        { startIdx: 0, endIdx: 2 }
      ]
    }
  ];
  