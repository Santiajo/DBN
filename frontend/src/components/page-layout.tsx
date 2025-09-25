import React from 'react';

type PageLayoutProps = {
  children: React.ReactNode;
  backgroundImage: string;
};

export default function PageLayout({ children, backgroundImage }: PageLayoutProps) {
  const style = {
    backgroundImage: `url(${backgroundImage})`,
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={style}
    >
      {children}
    </main>
  );
}