import { useEffect, useState } from 'react'
import { Sparkles, UserPlus, X } from 'lucide-react'
import type { NewStudentPayload } from '@/context/AppContext'
import { GRADE_CLASSES } from '@/data/mockData'
import type { SchoolShift, Student } from '@/types/arandu'

interface StudentFormModalProps {
  open: boolean
  onClose: () => void
  editingStudent: Student | null
  existingEnrollmentIds: string[]
  onSave: (payload: NewStudentPayload, existingId?: string) => void
}

const SHIFTS: SchoolShift[] = ['Integral', 'Manhã', 'Tarde']

function generateEnrollmentId(existingIds: string[]): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(10000 + Math.random() * 89999)
    const candidate = `2026-${suffix}`
    if (!existingIds.includes(candidate)) {
      return candidate
    }
  }
  return `2026-${Date.now().toString().slice(-5)}`
}

function buildInstitutionalEmail(fullName: string): string {
  const tokens = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (tokens.length === 0) return ''
  if (tokens.length === 1) return `${tokens[0]}@arandu.edu.br`
  return `${tokens[0]}.${tokens[tokens.length - 1]}@arandu.edu.br`
}

export function StudentFormModal({
  open,
  onClose,
  editingStudent,
  existingEnrollmentIds,
  onSave,
}: StudentFormModalProps) {
  const [name, setName] = useState('')
  const [enrollmentId, setEnrollmentId] = useState('')
  const [email, setEmail] = useState('')
  const [gradeClass, setGradeClass] = useState(GRADE_CLASSES[6]) // 3ª Série B
  const [shift, setShift] = useState<SchoolShift>('Integral')
  const [initialPassword, setInitialPassword] = useState('Arandu@2026')
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editingStudent) {
      setName(editingStudent.name)
      setEnrollmentId(editingStudent.enrollmentId)
      setEmail(editingStudent.email)
      setGradeClass(editingStudent.gradeClass)
      setShift(editingStudent.shift)
      setStatus(editingStudent.status)
      setInitialPassword('')
      setError('')
    } else {
      setName('')
      setEnrollmentId('')
      setEmail('')
      setGradeClass('3ª Série B')
      setShift('Integral')
      setStatus('ativo')
      setInitialPassword('Arandu@2026')
      setError('')
    }
  }, [editingStudent, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedEnrollment = enrollmentId.trim()

    if (!trimmedName || !trimmedEnrollment || !gradeClass) {
      setError('Preencha nome completo, matrícula escolar e turma.')
      return
    }

    const isDuplicateEnrollment = existingEnrollmentIds.some(
      (id) =>
        id.toLowerCase() === trimmedEnrollment.toLowerCase() &&
        id.toLowerCase() !== (editingStudent?.enrollmentId.toLowerCase() ?? ''),
    )

    if (isDuplicateEnrollment) {
      setError(`Já existe um estudante cadastrado com a matrícula ${trimmedEnrollment}.`)
      return
    }

    const resolvedEmail = email.trim() || buildInstitutionalEmail(trimmedName)

    onSave(
      {
        name: trimmedName,
        enrollmentId: trimmedEnrollment,
        email: resolvedEmail,
        gradeClass,
        shift,
        status,
      },
      editingStudent?.id,
    )
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-shadow-grey/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-surface shadow-modal">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brilliant-azure-50 text-brilliant-azure-700">
              <UserPlus className="h-4 w-4" />
            </div>
            <h2 id="student-modal-title" className="text-lg font-bold text-foreground">
              {editingStudent ? 'Editar Cadastro de Aluno' : 'Cadastrar Novo Aluno'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de cadastro de aluno"
            className="rounded-md p-1.5 text-muted hover:bg-default hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label htmlFor="student-name" className="mb-1.5 block text-xs font-semibold text-foreground">
              Nome completo *
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Sofia Mendonça Rocha"
              className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-focus"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="student-enrollment"
                className="mb-1.5 block text-xs font-semibold text-foreground"
              >
                Matrícula escolar *
              </label>
              <div className="flex gap-2">
                <input
                  id="student-enrollment"
                  type="text"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                  placeholder="2026-00000"
                  className="h-10 min-w-0 flex-1 rounded-field border border-border bg-background px-3 text-sm tabular-nums text-foreground focus-visible:outline-focus"
                />
                <button
                  type="button"
                  onClick={() => setEnrollmentId(generateEnrollmentId(existingEnrollmentIds))}
                  className="inline-flex shrink-0 items-center gap-1 rounded-field border border-border bg-surface-secondary px-3 text-xs font-semibold text-foreground hover:bg-default"
                  title="Gerar matrícula automática"
                >
                  <Sparkles className="h-3.5 w-3.5 text-brilliant-azure-600" />
                  Gerar
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="student-email" className="mb-1.5 block text-xs font-semibold text-foreground">
                E-mail institucional
              </label>
              <input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  name.trim() ? buildInstitutionalEmail(name) : 'nome.sobrenome@arandu.edu.br'
                }
                className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-focus"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="student-grade" className="mb-1.5 block text-xs font-semibold text-foreground">
                Turma / Série *
              </label>
              <select
                id="student-grade"
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-focus"
              >
                {GRADE_CLASSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-foreground">Turno</span>
              <div className="grid grid-cols-3 gap-1.5">
                {SHIFTS.map((item) => {
                  const active = shift === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setShift(item)}
                      className={`h-10 rounded-field border text-xs font-semibold transition-colors ${
                        active
                          ? 'border-shadow-grey bg-shadow-grey text-white'
                          : 'border-border bg-surface-secondary text-foreground hover:bg-default'
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {!editingStudent ? (
            <div>
              <label htmlFor="student-password" className="mb-1.5 block text-xs font-semibold text-foreground">
                Senha inicial de acesso (mock)
              </label>
              <input
                id="student-password"
                type="text"
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
                className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-focus"
              />
              <p className="mt-1 text-[11px] text-muted">
                Se deixar o e-mail em branco, geramos automaticamente no domínio `@arandu.edu.br`.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-field border border-border bg-surface-secondary px-3.5 py-2.5">
              <div>
                <p className="text-xs font-semibold text-foreground">Acesso do estudante</p>
                <p className="text-[11px] text-muted">
                  Estudantes desativados não conseguem realizar novos empréstimos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatus((prev) => (prev === 'ativo' ? 'inativo' : 'ativo'))}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  status === 'ativo'
                    ? 'bg-light-green/70 text-shadow-grey'
                    : 'bg-default text-muted'
                }`}
              >
                {status === 'ativo' ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-field border border-watermelon-300 bg-watermelon-50 px-3 py-2 text-xs font-medium text-watermelon-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-field border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-default"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-field bg-shadow-grey px-5 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-accent-foreground"
            >
              {editingStudent ? 'Salvar alterações' : 'Cadastrar aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
