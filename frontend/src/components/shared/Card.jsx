// src/components/shared/Card.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  const baseStyles = 'rounded-lg shadow-sm overflow-hidden';
  
  const variants = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md',
    outlined: 'border border-orange-200 bg-white',
  };

  const classes = [
    baseStyles,
    variants[variant],
    className,
  ].join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined']),
  className: PropTypes.string,
};

export default Card;