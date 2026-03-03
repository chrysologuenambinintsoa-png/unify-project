export default function Page({ title = 'Page', children }){
  return (
    <div>
      <div className="card"><h2>{title}</h2></div>
      <div style={{marginTop:12}}>{children}</div>
    </div>
  )
}
