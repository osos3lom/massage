import React from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export default function Link({ href, children, onClick, ...props }: LinkProps) {
  const hash = href.startsWith('#') ? href : `#${href}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !props.target) {
      window.location.hash = hash;
    }
  };

  return (
    <a href={hash} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
