import React from 'react';

interface ButtonProps {
  btnName: string;
  classStyles?: string;
  handleClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ btnName, classStyles = '', handleClick }) => (
  <button onClick={handleClick} type="button" className={`nft-gradient text-sm minlg:text-lg py-3 items-center justify-center px-6 minlg:px-8 font-poppins font-semibold text-white ${classStyles}`}>
    {btnName}
  </button>
);

export default Button;