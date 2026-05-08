import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Category = 'TWK' | 'TIU' | 'TKP'

export interface Question {
  id: string
  category: Category
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  points: number
}

export interface Answer {
  questionId: string
  selectedAnswer: number | null
  isCorrect: boolean
}

export interface TestResult {
  id: string
  date: string
  duration: number
  scores: {
    TWK: number
    TIU: number
    TKP: number
    total: number
  }
  passed: boolean
  answers: Answer[]
}

interface TestState {
  // Questions bank
  questions: Question[]
  setQuestions: (questions: Question[]) => void
  addQuestions: (questions: Question[]) => void
  
  // Current test
  currentAnswers: Map<string, number>
  setAnswer: (questionId: string, answer: number) => void
  clearAnswers: () => void
  
  // Test results history
  results: TestResult[]
  addResult: (result: TestResult) => void
  
  // Current question index
  currentQuestionIndex: number
  setCurrentQuestionIndex: (index: number) => void
  
  // Test timer
  timeRemaining: number
  setTimeRemaining: (time: number) => void
  
  // Test status
  isTestActive: boolean
  setIsTestActive: (active: boolean) => void
}

// Sample questions for demo
export const sampleQuestions: Question[] = [
  // TWK Questions
  {
    id: 'twk-1',
    category: 'TWK',
    question: 'Pancasila sebagai dasar negara Indonesia pertama kali diusulkan oleh...',
    options: ['Ir. Soekarno', 'Mohammad Hatta', 'Mr. Soepomo', 'Ki Hadjar Dewantara'],
    correctAnswer: 0,
    explanation: 'Pancasila pertama kali diusulkan oleh Ir. Soekarno pada tanggal 1 Juni 1945 dalam sidang BPUPKI.',
    points: 5,
  },
  {
    id: 'twk-2',
    category: 'TWK',
    question: 'UUD 1945 disahkan oleh PPKI pada tanggal...',
    options: ['17 Agustus 1945', '18 Agustus 1945', '19 Agustus 1945', '20 Agustus 1945'],
    correctAnswer: 1,
    explanation: 'UUD 1945 disahkan oleh PPKI pada tanggal 18 Agustus 1945, sehari setelah proklamasi kemerdekaan.',
    points: 5,
  },
  {
    id: 'twk-3',
    category: 'TWK',
    question: 'Lambang negara Indonesia adalah...',
    options: ['Garuda Merah', 'Garuda Pancasila', 'Burung Elang', 'Burung Rajawali'],
    correctAnswer: 1,
    explanation: 'Lambang negara Indonesia adalah Garuda Pancasila yang melambangkan kekuatan dan semangat Indonesia.',
    points: 5,
  },
  {
    id: 'twk-4',
    category: 'TWK',
    question: 'Bhinneka Tunggal Ika berasal dari kitab...',
    options: ['Negarakertagama', 'Sutasoma', 'Pararaton', 'Arjunawiwaha'],
    correctAnswer: 1,
    explanation: 'Semboyan Bhinneka Tunggal Ika berasal dari kitab Sutasoma karya Mpu Tantular.',
    points: 5,
  },
  {
    id: 'twk-5',
    category: 'TWK',
    question: 'Sistem pemerintahan Indonesia menurut UUD 1945 adalah...',
    options: ['Parlementer', 'Presidensial', 'Semi Presidensial', 'Federal'],
    correctAnswer: 1,
    explanation: 'Indonesia menganut sistem pemerintahan presidensial di mana presiden sebagai kepala negara dan kepala pemerintahan.',
    points: 5,
  },
  // TIU Questions
  {
    id: 'tiu-1',
    category: 'TIU',
    question: 'Jika 3x + 7 = 22, maka nilai x adalah...',
    options: ['3', '4', '5', '6'],
    correctAnswer: 2,
    explanation: '3x + 7 = 22 → 3x = 22 - 7 → 3x = 15 → x = 5',
    points: 5,
  },
  {
    id: 'tiu-2',
    category: 'TIU',
    question: 'DOKTER : PASIEN = GURU : ...',
    options: ['Sekolah', 'Murid', 'Buku', 'Kelas'],
    correctAnswer: 1,
    explanation: 'Dokter merawat pasien, guru mengajar murid. Keduanya merupakan hubungan pelaku dan objek yang dilayani.',
    points: 5,
  },
  {
    id: 'tiu-3',
    category: 'TIU',
    question: 'Deret berikut: 2, 6, 18, 54, ... Angka selanjutnya adalah...',
    options: ['108', '162', '216', '324'],
    correctAnswer: 1,
    explanation: 'Pola deret adalah kelipatan 3. 2×3=6, 6×3=18, 18×3=54, 54×3=162',
    points: 5,
  },
  {
    id: 'tiu-4',
    category: 'TIU',
    question: 'Antonim dari kata "ABSTRAK" adalah...',
    options: ['Nyata', 'Jelas', 'Konkret', 'Terang'],
    correctAnswer: 2,
    explanation: 'Abstrak berarti tidak berwujud/tidak nyata. Antonimnya adalah konkret yang berarti nyata/berwujud.',
    points: 5,
  },
  {
    id: 'tiu-5',
    category: 'TIU',
    question: 'Sinonim dari kata "ELABORASI" adalah...',
    options: ['Penjelasan', 'Pengurangan', 'Penambahan', 'Pengulangan'],
    correctAnswer: 0,
    explanation: 'Elaborasi berarti penggarapan secara tekun dan cermat, atau penjelasan yang lebih rinci.',
    points: 5,
  },
  // TKP Questions
  {
    id: 'tkp-1',
    category: 'TKP',
    question: 'Ketika atasan memberikan tugas yang sangat banyak, sikap Anda adalah...',
    options: [
      'Menolak dengan tegas karena tidak mungkin diselesaikan',
      'Menerima dan berusaha menyelesaikan sesuai kemampuan',
      'Meminta rekan kerja untuk membantu tanpa izin atasan',
      'Mengeluh kepada rekan kerja tentang atasan'
    ],
    correctAnswer: 1,
    explanation: 'Sikap profesional adalah menerima tugas dan berusaha menyelesaikan dengan baik, sambil berkomunikasi jika ada kendala.',
    points: 5,
  },
  {
    id: 'tkp-2',
    category: 'TKP',
    question: 'Anda melihat rekan kerja melakukan kesalahan dalam pekerjaan. Tindakan Anda adalah...',
    options: [
      'Melaporkan langsung ke atasan',
      'Menegur di depan rekan kerja lain',
      'Mengingatkan secara pribadi dengan sopan',
      'Membiarkan saja karena bukan urusan Anda'
    ],
    correctAnswer: 2,
    explanation: 'Mengingatkan secara pribadi dengan sopan adalah cara yang bijak untuk membantu rekan tanpa mempermalukan.',
    points: 5,
  },
  {
    id: 'tkp-3',
    category: 'TKP',
    question: 'Dalam sebuah rapat, pendapat Anda berbeda dengan mayoritas. Sikap Anda adalah...',
    options: [
      'Diam saja dan mengikuti keputusan mayoritas',
      'Menyampaikan pendapat dengan argumen yang jelas',
      'Memaksakan pendapat karena merasa paling benar',
      'Keluar dari rapat karena tidak setuju'
    ],
    correctAnswer: 1,
    explanation: 'Menyampaikan pendapat dengan argumen yang jelas menunjukkan sikap profesional dan kontributif dalam diskusi.',
    points: 5,
  },
  {
    id: 'tkp-4',
    category: 'TKP',
    question: 'Ketika menghadapi deadline yang ketat, Anda akan...',
    options: [
      'Bekerja lembur untuk menyelesaikan tepat waktu',
      'Meminta perpanjangan waktu kepada atasan',
      'Mengerjakan sebisanya tanpa peduli kualitas',
      'Menyerahkan tugas kepada rekan kerja'
    ],
    correctAnswer: 0,
    explanation: 'Bekerja lembur menunjukkan dedikasi dan tanggung jawab terhadap pekerjaan serta komitmen pada deadline.',
    points: 5,
  },
  {
    id: 'tkp-5',
    category: 'TKP',
    question: 'Anda mendapat kritik dari atasan atas hasil pekerjaan. Respons Anda adalah...',
    options: [
      'Membela diri dan menyalahkan keadaan',
      'Menerima dengan lapang dada dan memperbaiki',
      'Merasa tersinggung dan menjauh dari atasan',
      'Mengabaikan kritik karena merasa sudah benar'
    ],
    correctAnswer: 1,
    explanation: 'Menerima kritik dengan lapang dada dan memperbaiki menunjukkan sikap profesional dan kemauan untuk berkembang.',
    points: 5,
  },
]

export const useTestStore = create<TestState>()(
  persist(
    (set) => ({
      questions: sampleQuestions,
      setQuestions: (questions) => set({ questions }),
      addQuestions: (newQuestions) =>
        set((state) => ({ questions: [...state.questions, ...newQuestions] })),
      
      currentAnswers: new Map(),
      setAnswer: (questionId, answer) =>
        set((state) => {
          const newAnswers = new Map(state.currentAnswers)
          newAnswers.set(questionId, answer)
          return { currentAnswers: newAnswers }
        }),
      clearAnswers: () => set({ currentAnswers: new Map() }),
      
      results: [],
      addResult: (result) =>
        set((state) => ({ results: [result, ...state.results] })),
      
      currentQuestionIndex: 0,
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      
      timeRemaining: 100 * 60, // 100 minutes in seconds
      setTimeRemaining: (time) => set({ timeRemaining: time }),
      
      isTestActive: false,
      setIsTestActive: (active) => set({ isTestActive: active }),
    }),
    {
      name: 'cpns-test-storage',
      partialize: (state) => ({
        questions: state.questions,
        results: state.results,
      }),
    }
  )
)

// Passing scores
export const PASSING_SCORES = {
  TWK: 65,
  TIU: 80,
  TKP: 166,
}

// Calculate scores
export function calculateScores(
  questions: Question[],
  answers: Map<string, number>
): { TWK: number; TIU: number; TKP: number; total: number } {
  const scores = { TWK: 0, TIU: 0, TKP: 0, total: 0 }
  
  questions.forEach((q) => {
    const answer = answers.get(q.id)
    if (answer !== undefined && answer === q.correctAnswer) {
      scores[q.category] += q.points
    }
  })
  
  scores.total = scores.TWK + scores.TIU + scores.TKP
  return scores
}

// Check if passed
export function checkPassed(scores: { TWK: number; TIU: number; TKP: number }): boolean {
  return (
    scores.TWK >= PASSING_SCORES.TWK &&
    scores.TIU >= PASSING_SCORES.TIU &&
    scores.TKP >= PASSING_SCORES.TKP
  )
}
