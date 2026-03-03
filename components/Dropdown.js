export default function Dropdown({ children, open }){
  return (
    <div className={`dropdown-menu ${open ? 'open' : ''}`}>{children}</div>
  )
}
