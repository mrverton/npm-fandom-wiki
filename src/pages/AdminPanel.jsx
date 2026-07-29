import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, ShieldCheck, RefreshCw } from 'lucide-react'
import Layout from '../components/Layout'
import { TopBar } from '../components/TopBar'
import { getTheme } from '../utils/theme'
import { useCharacters } from '../context/CharactersContext'

export default function AdminPanel() {
  const navigate = useNavigate()
  const { characters, loading, usingFallback, removeCharacter, reload } = useCharacters()
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleDelete = async (character) => {
    if (character.dbId == null) {
      setErrorMsg('Этот персонаж существует только в локальном файле — удалить через админку нельзя, пока бэкенд не подключён.')
      return
    }
    setErrorMsg(null)
    setDeletingId(character.dbId)
    try {
      await removeCharacter(character.dbId)
      setConfirmId(null)
    } catch (err) {
      setErrorMsg(err.message || 'Не удалось удалить персонажа')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Layout
      header={
        <TopBar
          title="Админ-панель"
          subtitle="управление персонажами"
          showBack
          accentClass="text-cortex"
        />
      }
    >
      <div className="space-y-4">
        <div className="panel p-3.5 flex items-center gap-3 border border-cortex/30 animate-fade-up">
          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-cortex/10 border border-cortex/40">
            <ShieldCheck size={16} className="text-cortex" />
          </div>
          <p className="text-xs text-slate-400 leading-snug">
            Изменения отправляются напрямую в базу данных бэкенда и сразу видны всем пользователям вики.
          </p>
        </div>

        {usingFallback && (
          <div className="panel p-3.5 border border-amber-signal/30 text-xs text-amber-signal leading-snug animate-fade-up">
            Бэкенд недоступен — показаны локальные данные из wiki_data.json. Добавление/редактирование/удаление
            через админку сейчас не сработает, пока API не отвечает.
          </div>
        )}

        {errorMsg && (
          <div className="panel p-3.5 border border-rose-500/40 text-xs text-rose-400 leading-snug animate-fade-up">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-2 animate-fade-up">
          <button
            onClick={() => navigate('/admin/new')}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-verton/40 bg-verton/10 text-verton py-2.5 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <Plus size={16} /> Добавить персонажа
          </button>
          <button
            onClick={reload}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-base-600/60 bg-base-850/70 text-slate-300 active:scale-95 transition-transform"
            aria-label="Обновить список"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-2.5">
          {characters.map((character, i) => {
            const theme = getTheme(character.color)
            const isConfirming = confirmId === character.dbId
            return (
              <div
                key={character.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="panel animate-fade-up p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border ${theme.border} ${theme.bgSoft}`}>
                    <span className={`font-display font-bold text-base ${theme.text}`}>{character.avatarInitial}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100 truncate">{character.name}</p>
                    <p className="text-xs text-slate-500 truncate">{character.role}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/edit/${character.id}`)}
                    className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-qzero/40 bg-qzero/10 text-qzero active:scale-95 transition-transform"
                    aria-label="Редактировать"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmId(isConfirming ? null : character.dbId)}
                    className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 active:scale-95 transition-transform"
                    aria-label="Удалить"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {isConfirming && (
                  <div className="mt-3 pt-3 border-t border-base-600/50 flex items-center justify-between gap-2 animate-fade-in">
                    <p className="text-xs text-slate-400">Точно удалить «{character.name}»?</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-base-600/60 text-slate-300"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleDelete(character)}
                        disabled={deletingId === character.dbId}
                        className="text-xs px-3 py-1.5 rounded-lg border border-rose-500/50 bg-rose-500/15 text-rose-400 disabled:opacity-50"
                      >
                        {deletingId === character.dbId ? 'Удаляю...' : 'Удалить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
