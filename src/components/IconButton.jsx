export function IconButton({ children, className = '', ...props }) {
  // 20-FIX: inline style'lar CSS classlarga ko'chirildi (index.css — .icon-btn-*)
  // Base holat index.css'dagi .icon-btn orqali beriladi; qo'shimcha stil className orqali.
  return (
    <button
      className={`icon-btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default IconButton;
