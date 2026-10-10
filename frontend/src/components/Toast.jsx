import { createContext, useCallback, useContext, useState } from 'react'
const T = createContext(() => {})
export const useToast = () => useContext(T)
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((message, type = 'success') => {
    const id = Math.random()
    setItems((x) => [...x, { id, message, type }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 4500)
  }, [])
  return (
    <T.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={`rounded-lg px-4 py-3 text-sm text-white shadow-lg ${i.type === 'error' ? 'bg-red-700' : 'bg-green-700'}`}>
            {i.type === 'error' ? 'Error: ' : 'Success: '}{i.message}
          </div>
        ))}
      </div>
    </T.Provider>
  )
}
