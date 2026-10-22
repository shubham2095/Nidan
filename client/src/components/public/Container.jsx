const SIZES = {
  wide: 'max-w-7xl',
  narrow: 'max-w-3xl',
};

/** Centered page column. Use `size` for width; extra classes are for spacing only. */
export default function Container({ as: Tag = 'div', size = 'wide', className = '', children, ...rest }) {
  return (
    <Tag className={`mx-auto w-full ${SIZES[size]} px-4 sm:px-6 lg:px-8 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
