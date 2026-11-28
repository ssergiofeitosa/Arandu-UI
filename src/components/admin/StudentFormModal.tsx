import { useEffect, useState } from 'react'
import { Loader2, Plus, Sparkles, UserPlus, X } from 'lucide-react'
import { DialogModal } from '@/components/ui/DialogModal'
import { ApiError } from '@/services/api'
import type { CreateAlunoInput, UpdateAlunoInput } from '@/services/gestaoContasService'
import type { ClassRoom, SchoolShiftCode, Student } from '@/types/arandu'

interface StudentFormModalProps {
  open: boolean
  onClose: () => void
  editingStudent: Student | null
  classRooms: ClassRoom[]
  existingEnrollmentIds: string[]
  onCreateClassRoom: (payload: {
    name: string
    shiftCode: SchoolShiftCode
    schoolYear: number
  }) => Promise<ClassRoom>
  onSave: (payload: CreateAlunoInput | UpdateAlunoInput, existingId?: string) => Promise<void>
}

const SHIFT_OPTIONS: { code: SchoolShiftCode; label: string }[] = [
  { code: 'INTEGRAL', label: 'Integral' },
  { code: 'MANHA', label: 'Manhã' },
  { code: 'TARDE', label: 'Tarde' },
]

function generateEnrollmentId(existingIds: string[]): string {
  const year = new Date().getFullYear()
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(10000 + Math.random() * 89999)
    const candidate = `${year}-${suffix}`
    if (!existingIds.includes(candidate)) {
      return candidate
    }
  }
  return `${year}-${Date.now().toString().slice(-5)}`
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
  classRooms,
  existingEnrollmentIds,
  onCreateClassRoom,
  onSave,
}: StudentFormModalProps) {
  const [name, setName] = useState('')
  const [enrollmentId, setEnrollmentId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [classRoomId, setClassRoomId] = useState<string>('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Criação rápida de turma inline
  const [showNewClassForm, setShowNewClassForm] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassShift, setNewClassShift] = useState<SchoolShiftCode>('INTEGRAL')
  const [newClassYear, setNewClassYear] = useState(String(new Date().getFullYear()))
  const [creatingClass, setCreatingClass] = useState(false)
  const [classError, setClassError] = useState('')

  useEffect(() => {
    if (!open) return
    setShowNewClassForm(false)
    setClassError('')
    setNewClassName('')
    setNewClassShift('INTEGRAL')
    setNewClassYear(String(new Date().getFullYear()))
    setError('')

    if (editingStudent) {
      setName(editingStudent.name)
      setEnrollmentId(editingStudent.enrollmentId)
      setEmail(editingStudent.email)
      setPhone(editingStudent.phone || '')
      setClassRoomId(editingStudent.classRoomId || '')
      setStatus(editingStudent.status)
      setPassword('')
    } else {
      setName('')
      setEnrollmentId('')
      setEmail('')
      setPhone('')
      setClassRoomId(classRooms[0]?.id || '')
      setStatus('ativo')
      setPassword('')
    }
  }, [classRooms, editingStudent, open])

  const selectedClassRoom = classRooms.find((c) => c.id === classRoomId) || null

  const handleQuickCreateClass = async () => {
    const trimmed = newClassName.trim()
    if (!trimmed) {
      setClassError('Informe o nome da turma (ex.: 1ª Série A).')
      return
    }
    const parsedYear = Number.parseInt(newClassYear, 10)
    const schoolYear =
      Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
        ? parsedYear
        : new Date().getFullYear()

    setClassError('')
    setCreatingClass(true)
    try {
      const created = await onCreateClassRoom({
        name: trimmed,
        shiftCode: newClassShift,
        schoolYear,
      })
      setClassRoomId(created.id)
      setNewClassName('')
      setShowNewClassForm(false)
    } catch (err) {
      setClassError(
        err instanceof ApiError ? err.message : 'Não foi possível cadastrar a turma agora.',
      )
    } finally {
      setCreatingClass(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedEnrollment = enrollmentId.trim()

    if (!trimmedName || !trimmedEnrollment) {
      setError('Preencha nome completo e matrícula escolar.')
      return
    }

    const resolvedEmail = email.trim() || buildInstitutionalEmail(trimmedName)
    if (!resolvedEmail) {
      setError('Informe um e-mail institucional válido.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const payload: CreateAlunoInput | UpdateAlunoInput = {
        name: trimmedName,
        enrollmentId: trimmedEnrollment,
        email: resolvedEmail,
        classRoomId: classRoomId || null,
        phone: phone.trim() || undefined,
        active: status === 'ativo',
        ...(password.trim() ? { password } : {}),
      }
      await onSave(payload, editingStudent?.id)
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar os dados do estudante.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const nameInvalid = Boolean(error && !name.trim())
  const enrollmentInvalid = Boolean(
    error && (!enrollmentId.trim() || error.toLowerCase().includes('matrícula')),
  )

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      labelledBy="student-modal-title"
      maxWidthClass="max-w-xl"
    >
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

      <form onSubmit={handleSubmit} noValidate className="space-y-4 p-6">
        <div>
          <label htmlFor="student-name" className="mb-1.5 block text-xs font-semibold text-foreground">
            Nome completo *
          </label>
          <input
            id="student-name"
            type="text"
            required
            aria-invalid={nameInvalid}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="Ex.: Sofia Mendonça Rocha"
            className={`h-10 w-full rounded-field border bg-background px-3 text-sm text-foreground focus-visible:outline-focus ${
              nameInvalid ? 'border-watermelon-500' : 'border-border'
            }`}
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
                required
                aria-invalid={enrollmentInvalid}
                value={enrollmentId}
                onChange={(e) => {
                  setEnrollmentId(e.target.value)
                  if (error) setError('')
                }}
                placeholder="2026-00000"
                className={`h-10 min-w-0 flex-1 rounded-field border bg-background px-3 text-sm tabular-nums text-foreground focus-visible:outline-focus ${
                  enrollmentInvalid ? 'border-watermelon-500' : 'border-border'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setEnrollmentId(generateEnrollmentId(existingEnrollmentIds))
                  if (error) setError('')
                }}
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
              E-mail institucional *
            </label>
            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError('')
              }}
              placeholder={
                name.trim() ? buildInstitutionalEmail(name) : 'nome.sobrenome@arandu.edu.br'
              }
              className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-focus"
            />
          </div>
        </div>

        {/* Turma (UUID real) + Telefone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="student-grade" className="text-xs font-semibold text-foreground">
                Turma / Série
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowNewClassForm((prev) => !prev)
                  setClassError('')
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brilliant-azure-700 hover:underline"
              >
                <Plus className="h-3 w-3" />
                {showNewClassForm ? 'Cancelar turma' : 'Nova turma'}
              </button>
            </div>
            <select
              id="student-grade"
              value={classRoomId}
              onChange={(e) => setClassRoomId(e.target.value)}
              className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm leading-normal text-foreground focus-visible:outline-focus"
            >
              <option value="">Sem turma definida</option>
              {classRooms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.shift} • {item.schoolYear})
                </option>
              ))}
            </select>
            {selectedClassRoom && (
              <p className="mt-1 text-[11px] text-muted">
                Turno: <strong className="text-foreground">{selectedClassRoom.shift}</strong> • Ano{' '}
                {selectedClassRoom.schoolYear}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="student-phone" className="mb-1.5 block text-xs font-semibold text-foreground">
              Telefone (opcional)
            </label>
            <input
              id="student-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(81) 99999-0000"
              className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-focus"
            />
          </div>
        </div>

        {/* Subformulário inline de Nova Turma */}
        {showNewClassForm && (
          <div className="space-y-3 rounded-field border border-border bg-surface-secondary p-3.5">
            <p className="text-xs font-semibold text-foreground">Cadastrar nova turma escolar</p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => {
                  setNewClassName(e.target.value)
                  if (classError) setClassError('')
                }}
                placeholder="Ex.: 2ª Série A"
                aria-label="Nome da nova turma"
                className="h-9 rounded-field border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-focus"
              />
              <select
                value={newClassShift}
                onChange={(e) => setNewClassShift(e.target.value as SchoolShiftCode)}
                aria-label="Turno da nova turma"
                className="h-9 rounded-field border border-border bg-background px-2.5 text-xs text-foreground focus-visible:outline-focus"
              >
                {SHIFT_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={2000}
                max={2100}
                value={newClassYear}
                onChange={(e) => setNewClassYear(e.target.value)}
                aria-label="Ano letivo da nova turma"
                className="h-9 rounded-field border border-border bg-background px-2.5 text-xs tabular-nums text-foreground focus-visible:outline-focus"
              />
            </div>

            {classError && (
              <p role="alert" className="text-xs font-medium text-watermelon-700">
                {classError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={creatingClass}
                onClick={handleQuickCreateClass}
                className="inline-flex items-center gap-1.5 rounded-field bg-shadow-grey px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
              >
                {creatingClass && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Salvar turma
              </button>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="student-password" className="mb-1.5 block text-xs font-semibold text-foreground">
            {editingStudent ? 'Redefinir senha (opcional)' : 'Senha inicial (opcional)'}
          </label>
          <input
            id="student-password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              editingStudent
                ? 'Deixe em branco para manter a senha atual'
                : 'Deixe em branco para gerar senha temporária automática'
            }
            className="h-10 w-full rounded-field border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-focus"
          />
          {!editingStudent && (
            <p className="mt-1 text-xs text-muted">
              Se deixar em branco, o sistema gera uma senha temporária segura e exibe uma única vez
              após o cadastro (além de enviar e-mail de boas-vindas).
            </p>
          )}
        </div>

        {editingStudent && (
          <div className="flex items-center justify-between rounded-field border border-border bg-surface-secondary px-3.5 py-2.5">
            <div>
              <p className="text-xs font-semibold text-foreground">Acesso do estudante</p>
              <p className="text-xs text-muted">
                Estudantes desativados têm o login e novos empréstimos bloqueados imediatamente.
              </p>
            </div>
            <button
              type="button"
              aria-pressed={status === 'ativo'}
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
          <p
            role="alert"
            className="rounded-field border border-watermelon-300 bg-watermelon-50 px-3 py-2 text-xs font-medium text-watermelon-700"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2.5 border-t border-border pt-4">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-field border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-default disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-field bg-shadow-grey px-5 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingStudent ? 'Salvar alterações' : 'Cadastrar aluno'}
          </button>
        </div>
      </form>
    </DialogModal>
  )
}
