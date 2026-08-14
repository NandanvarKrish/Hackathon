import { LectureMedia, LectureSession, SmartNote } from '../types/notes';

// Sample Diagram SVG as data URLs for offline rich graphics
export const SAMPLE_QUANTUM_DIAGRAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" fill="%230f172a"><rect width="100%" height="100%" rx="12" fill="%230f172a"/><circle cx="200" cy="175" r="100" stroke="%2338bdf8" stroke-width="2.5" fill="none" stroke-dasharray="4 4"/><ellipse cx="200" cy="175" rx="100" ry="30" stroke="%2364748b" stroke-width="1.5" fill="none"/><line x1="200" y1="50" x2="200" y2="300" stroke="%2394a3b8" stroke-width="2"/><line x1="75" y1="175" x2="325" y2="175" stroke="%2394a3b8" stroke-width="2"/><line x1="200" y1="175" x2="270" y2="105" stroke="%23f43f5e" stroke-width="3.5" marker-end="url(%23arrow)"/><text x="200" y="40" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">|0⟩ (North Pole)</text><text x="200" y="325" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">|1⟩ (South Pole)</text><text x="280" y="95" fill="%23f43f5e" font-family="sans-serif" font-size="14" font-weight="bold">|ψ⟩ = α|0⟩ + β|1⟩</text><rect x="360" y="50" width="210" height="250" rx="8" fill="%231e293b" stroke="%23334155"/><text x="375" y="85" fill="%23f8fafc" font-family="sans-serif" font-size="15" font-weight="bold">Bloch Sphere Principles</text><text x="375" y="115" fill="%2394a3b8" font-family="sans-serif" font-size="13">• Pure state on sphere surface</text><text x="375" y="140" fill="%2394a3b8" font-family="sans-serif" font-size="13">• Mixed states in sphere interior</text><text x="375" y="165" fill="%2394a3b8" font-family="sans-serif" font-size="13">• Unitary Gates = 3D Rotations</text><text x="375" y="195" fill="%2338bdf8" font-family="sans-serif" font-size="13" font-weight="bold">Hadamard Gate (H):</text><text x="375" y="220" fill="%23cbd5e1" font-family="monospace" font-size="12">1/√2 [ [1, 1], [1, -1] ]</text><text x="375" y="250" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">✓ Real-time AI Vision OCR</text></svg>`;

export const SAMPLE_NEURAL_DIAGRAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" fill="%230f172a"><rect width="100%" height="100%" rx="12" fill="%230f172a"/><text x="300" y="40" fill="%2338bdf8" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">Multi-Head Scaled Dot-Product Attention</text><rect x="50" y="80" width="140" height="60" rx="8" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="120" y="115" fill="%23f8fafc" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Queries (Q)</text><rect x="230" y="80" width="140" height="60" rx="8" fill="%231e293b" stroke="%23a855f7" stroke-width="2"/><text x="300" y="115" fill="%23f8fafc" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Keys (K)</text><rect x="410" y="80" width="140" height="60" rx="8" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><text x="480" y="115" fill="%23f8fafc" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Values (V)</text><rect x="150" y="180" width="300" height="70" rx="10" fill="%23334155" stroke="%23f59e0b" stroke-width="2"/><text x="300" y="210" fill="%23f8fafc" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">Attention(Q, K, V)</text><text x="300" y="235" fill="%23fcd34d" font-family="monospace" font-size="13" text-anchor="middle">softmax( Q K^T / √d_k ) V</text><rect x="180" y="280" width="240" height="45" rx="6" fill="%230284c7"/><text x="300" y="308" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Contextual Output Tensor</text></svg>`;

export const SAMPLE_MEDIA_QUANTUM: LectureMedia = {
  id: 'media-1',
  timestamp: 24,
  imageUrl: SAMPLE_QUANTUM_DIAGRAM,
  title: 'Whiteboard: Bloch Sphere & State Vector Rotation',
  ocrText: 'North Pole = |0⟩, South Pole = |1⟩\nState Vector: |ψ⟩ = α|0⟩ + β|1⟩\nHadamard Gate H = 1/√2 [[1, 1], [1, -1]]\nGeometric interpretation: 180° rotation around X+Z axis.',
  aiExplanation: 'The lecturer illustrated the single-qubit Bloch Sphere on the whiteboard. The state vector |ψ⟩ represents any arbitrary superposition, where α and β are probability amplitudes governed by the normalization condition |α|² + |β|² = 1.',
  tags: ['Quantum Mechanics', 'Bloch Sphere', 'Qubits', 'Hadamard Gate', 'Visual OCR']
};

export const SAMPLE_MEDIA_NEURAL: LectureMedia = {
  id: 'media-2',
  timestamp: 50,
  imageUrl: SAMPLE_NEURAL_DIAGRAM,
  title: 'Slide 14: Multi-Head Scaled Attention Mechanism',
  ocrText: 'Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V\nMultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W_O',
  aiExplanation: 'Detailed structural diagram of Transformer scaled dot-product attention. Dividing by √d_k prevents dot products from growing excessively large in high dimensions, preventing small gradients in the softmax function.',
  tags: ['Deep Learning', 'Transformers', 'Attention Mechanism', 'NLP Architecture']
};

export const INITIAL_LECTURE: LectureSession = {
  id: 'session-quantum-101',
  title: 'Physics 301: Quantum Superposition & Entangled Computing',
  subject: 'Quantum Physics',
  date: 'August 13, 2026',
  duration: 245,
  rawTranscript: `Welcome everyone to Physics 301. Today we are diving straight into quantum superposition and the geometry of qubits. In classical computing, every bit is either zero or one. But in quantum mechanics, thanks to the superposition principle, a qubit can exist in a linear combination of basis states: psi equals alpha zero plus beta one. We visualize this using the Bloch Sphere on the board. Notice that alpha squared plus beta squared must equal one for total probability conservation. When we apply a Hadamard gate, we transform a definite zero state into an equal probability superposition. Furthermore, when two qubits are entangled through a CNOT operation, we achieve non-local correlations that Einstein called spooky action at a distance. Let us review the action items and problem set for next Tuesday.`,
  transcript: [
    { id: 't-1', timestamp: 0, speaker: 'Prof. Vance', text: 'Welcome everyone to Physics 301. Today we are diving straight into quantum superposition and the geometry of qubits.' },
    { id: 't-2', timestamp: 15, speaker: 'Prof. Vance', text: 'In classical computing, every bit is either zero or one. But in quantum mechanics, thanks to the superposition principle, a qubit can exist in a linear combination of basis states.' },
    { id: 't-3', timestamp: 35, speaker: 'Prof. Vance', text: 'We write this state as: psi equals alpha zero plus beta one. Notice on the whiteboard diagram of the Bloch Sphere, the north pole represents state zero and the south pole represents state one.' },
    { id: 't-4', timestamp: 65, speaker: 'Prof. Vance', text: 'When we apply a unitary transformation like the Hadamard gate, it rotates the state vector into an equal superposition.' },
    { id: 't-5', timestamp: 95, speaker: 'Prof. Vance', text: 'Next, when we entangle two qubits via a controlled-NOT gate, measuring one qubit instantly determines the state of the other.' }
  ],
  media: [SAMPLE_MEDIA_QUANTUM],
  notes: {
    title: 'Quantum Superposition, Bloch Sphere & Logic Gates',
    executiveSummary: 'This lecture examines the fundamental mechanics of quantum information processing, contrasting classical binary switches with continuous Hilbert state vectors, geometric rotations on the Bloch Sphere, and entanglement.',
    keyTakeaways: [
      'A classical bit is discrete (0 or 1), while a qubit exists in a continuous superposition: |ψ⟩ = α|0⟩ + β|1⟩.',
      'The Bloch Sphere maps pure quantum states to coordinates on a 3D unit sphere.',
      'Normalization requires |α|² + |β|² = 1 to guarantee total measurement probability equals 100%.',
      'The Hadamard gate produces equal superposition states essential for quantum speedup algorithms.'
    ],
    sections: [
      {
        id: 'sec-1',
        timestamp: 0,
        title: '1. Fundamentals of Quantum Bits (Qubits)',
        content: 'Classical computing is governed by Boolean logic where transistors act as binary switches. Quantum computing leverages wave function superposition, allowing computational units to process complex multi-state amplitudes simultaneously.',
        bulletPoints: [
          'State vector notation: |ψ⟩ represents the quantum state in Dirac bra-ket notation.',
          'Measurement collapses the superposition into a single classical outcome.'
        ],
        keyFormula: '|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle \\quad \\text{with } |\\alpha|^2 + |\\beta|^2 = 1',
        mediaId: 'media-1'
      },
      {
        id: 'sec-2',
        timestamp: 65,
        title: '2. Unitary Operations & The Hadamard Gate',
        content: 'Quantum logic gates are reversible transformations represented by unitary matrices (U†U = I). The Hadamard gate is one of the most critical single-qubit gates, creating superposition from basis states.',
        bulletPoints: [
          'H|0⟩ = (|0⟩ + |1⟩) / √2',
          'H|1⟩ = (|0⟩ - |1⟩) / √2'
        ],
        codeSnippet: '# Qiskit Single Qubit Superposition\nfrom qiskit import QuantumCircuit\nqc = QuantumCircuit(1, 1)\nqc.h(0)  # Apply Hadamard Gate\nqc.measure(0, 0)'
      },
      {
        id: 'sec-3',
        timestamp: 95,
        title: '3. Quantum Entanglement & Non-Local Correlations',
        content: 'Entanglement occurs when quantum systems cannot be described independently of one another. Entangled Bell states form the backbone of quantum cryptography, teleportation, and superdense coding.',
        bulletPoints: [
          'Maximally entangled Bell state: |Φ⁺⟩ = (|00⟩ + |11⟩) / √2',
          'Measurement of qubit A immediately specifies the measurement result of qubit B.'
        ]
      }
    ],
    keyTerms: [
      { term: 'Superposition', definition: 'The ability of a quantum system to exist in multiple state configurations simultaneously until observed.' },
      { term: 'Bloch Sphere', definition: 'A 2-sphere representation of a two-level quantum system (qubit state space).' },
      { term: 'Unitary Operator', definition: 'A linear mapping that preserves vector length, ensuring conservation of probability in quantum mechanics.' }
    ],
    actionItems: [
      { id: 'act-1', text: 'Verify normalization equation on Problem Set 3', completed: true },
      { id: 'act-2', text: 'Calculate the matrix product of Hadamard applied twice (H² = I)', completed: false },
      { id: 'act-3', text: 'Read Chapter 4 on Bell Inequality violations', completed: false }
    ],
    flashcards: [
      { id: 'fc-1', front: 'What is the formula for a single qubit state vector in superposition?', back: '|ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1', category: 'Quantum Math' },
      { id: 'fc-2', front: 'What does the north pole of the Bloch Sphere represent?', back: 'The pure basis state |0⟩', category: 'Geometry' },
      { id: 'fc-3', front: 'What is the result of applying a Hadamard gate to |0⟩?', back: '(|0⟩ + |1⟩) / √2 — an equal probability superposition', category: 'Quantum Gates' },
      { id: 'fc-4', front: 'Why must quantum gates be unitary matrices?', back: 'To conserve total probability and ensure all quantum operations are reversible', category: 'Principles' }
    ],
    quiz: [
      {
        id: 'q-1',
        question: 'If a qubit is in state |ψ⟩ = (1/2)|0⟩ + (√3/2)|1⟩, what is the probability of measuring |1⟩?',
        options: ['25% (1/4)', '50% (1/2)', '75% (3/4)', '100% (1)'],
        correctIndex: 2,
        explanation: 'Probability is equal to |β|² = (√3/2)² = 3/4 = 75%.'
      },
      {
        id: 'q-2',
        question: 'Which quantum gate creates an equal superposition from the basis state |0⟩?',
        options: ['Pauli-X Gate', 'Hadamard Gate (H)', 'Phase S-Gate', 'CNOT Gate'],
        correctIndex: 1,
        explanation: 'The Hadamard gate creates the (|0⟩ + |1⟩)/√2 state from |0⟩.'
      },
      {
        id: 'q-3',
        question: 'What happens to the quantum state upon measurement?',
        options: ['It multiplies exponentially', 'It collapses into one of the definite basis states', 'It rotates 90 degrees on the Bloch sphere', 'It becomes indefinitely entangled'],
        correctIndex: 1,
        explanation: 'Measurement causes wave-function collapse into a deterministic classical state.'
      }
    ],
    mindmap: {
      root: {
        id: 'root',
        label: 'Quantum Computing Fundamentals',
        description: 'Lecture 301 Overview',
        children: [
          {
            id: 'b-1',
            label: '1. Qubit Superposition',
            description: 'Core State Representation',
            children: [
              { id: 'b1-1', label: 'Dirac Notation |ψ⟩' },
              { id: 'b1-2', label: 'Amplitudes α & β' },
              { id: 'b1-3', label: 'Bloch Sphere (3D)' }
            ]
          },
          {
            id: 'b-2',
            label: '2. Quantum Logic Gates',
            description: 'Reversible Unitary Operators',
            children: [
              { id: 'b2-1', label: 'Hadamard Gate (H)' },
              { id: 'b2-2', label: 'Pauli Gates (X, Y, Z)' },
              { id: 'b2-3', label: 'Controlled-NOT (CNOT)' }
            ]
          },
          {
            id: 'b-3',
            label: '3. Entanglement',
            description: 'Non-Local Quantum Correlation',
            children: [
              { id: 'b3-1', label: 'Bell States |Φ⁺⟩' },
              { id: 'b3-2', label: 'Quantum Teleportation' }
            ]
          }
        ]
      }
    }
  },
  podcast: {
    id: 'pod-quantum-master',
    title: 'Episode 42: Breaking the Qubit Barrier',
    format: 'dual_host',
    description: 'Alex & Jordan break down qubits, the Bloch Sphere, and how quantum superposition works with lively banter and clear analogies.',
    dialogue: [
      {
        id: 'line-1',
        speaker: 'Alex',
        speakerRole: 'Host & Tech Enthusiast',
        text: 'Welcome back to EchoNote Deep Dives! Jordan, today we have to talk about quantum superposition. I used to think a qubit was just a coin spinning on a table.',
        timestampOffset: 0,
        emotion: 'excited'
      },
      {
        id: 'line-2',
        speaker: 'Jordan',
        speakerRole: 'Co-Host & Science Analyst',
        text: 'Haha, the spinning coin is actually a classic analogy! But today the professor took it further with the Bloch Sphere. Picture a globe where the North Pole is zero and the South Pole is one.',
        timestampOffset: 6,
        emotion: 'explaining'
      },
      {
        id: 'line-3',
        speaker: 'Alex',
        speakerRole: 'Host & Tech Enthusiast',
        text: 'And any point on that globe—the equator, the tropics—is a valid quantum superposition! That means infinite possible states before measurement, right?',
        timestampOffset: 14,
        emotion: 'curious'
      },
      {
        id: 'line-4',
        speaker: 'Jordan',
        speakerRole: 'Co-Host & Science Analyst',
        text: 'Exactly! But remember the catch: the second you measure it, the wave function collapses to either North or South Pole. The probability depends on the squared amplitudes alpha and beta.',
        timestampOffset: 22,
        emotion: 'thoughtful'
      },
      {
        id: 'line-5',
        speaker: 'Alex',
        speakerRole: 'Host & Tech Enthusiast',
        text: 'And that is why the Hadamard gate is such a rockstar—it rotates your zero state right onto the equator! By the way, listeners, you can hit "Interrupt Host" at any time if you want us to explain a step!',
        timestampOffset: 31,
        emotion: 'excited'
      },
      {
        id: 'line-6',
        speaker: 'Jordan',
        speakerRole: 'Co-Host & Science Analyst',
        text: 'Next up: when you link two qubits with a CNOT gate, you get quantum entanglement. Einstein called it spooky, but today it is the engine of quantum cryptography.',
        timestampOffset: 40,
        emotion: 'explaining'
      }
    ]
  }
};

// Simulation Lecture Script for Live "Simulated Stream"
export const SIMULATED_LECTURE_STREAM = [
  "Welcome class! Today we are discussing deep neural networks and attention mechanisms.",
  "In sequence modeling, traditional Recurrent Neural Networks suffered from vanishing gradients over long context windows.",
  "In 2017, the breakthrough paper 'Attention Is All You Need' introduced the Transformer architecture.",
  "The fundamental operation is Scaled Dot-Product Attention: Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V.",
  "Let me capture this slide on the whiteboard so you can inspect the multi-head projections.",
  "Notice that dividing by the square root of the key dimension d_k scales the dot products to prevent softmax saturation.",
  "This architecture powers modern Large Language Models and state-of-the-art vision systems.",
  "For homework, inspect the self-attention tensor dimensions in PyTorch."
];
