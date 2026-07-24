export function IconButton({ children, className = '', style, ...props }) {
  return (
    <button
      className={`flex items-center justify-center transition-all ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}

export default IconButton;
