export default function Modal({ open, onClose, title, children, footer }){
  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={(e)=>{ if(e.target.classList.contains('modal-overlay')) onClose?.() }}>
      <div className="modal">
        <div className="modal-header">
          <div></div>
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
