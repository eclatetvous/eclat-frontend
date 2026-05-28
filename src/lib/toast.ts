
import toast from 'react-hot-toast'

export const notify = {
  success: (msg: string) => toast.success(msg, { duration: 2500, style: { background: '#E1F5EE', color: '#085041', border: '1px solid #1D9E75', fontWeight: 500 } }),
  error:   (msg: string) => toast.error(msg,   { duration: 4000, style: { background: '#FAECE7', color: '#9B3A1F', border: '1px solid #D85A30', fontWeight: 500 } }),
  info:    (msg: string) => toast(msg,          { duration: 2000, style: { background: '#EEEDFE', color: '#2E2580', border: '1px solid #534AB7', fontWeight: 500 } }),
  loading: (msg: string) => toast.loading(msg),
  dismiss: (id: string)  => toast.dismiss(id),
}
