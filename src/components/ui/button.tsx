"use client";

import React from "react";

type ButtonVariant = "default" | "ghost";
type ButtonSize = "default" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: false;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonAsChildProps = React.HTMLAttributes<HTMLElement> & {
  asChild: true;
  children: React.ReactElement<{ className?: string }>;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getButtonClassName({
  className,
  variant = "default",
  size = "default",
}: {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return cx(
    "landing-button-font inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
    variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
    size === "default" && "h-9 px-4 py-2",
    size === "lg" && "h-10 px-6",
    className,
  );
}

function Button(props: ButtonProps | ButtonAsChildProps) {
  const { className, variant, size } = props;
  const resolvedClassName = getButtonClassName({ className, variant, size });

  if (props.asChild) {
    const { children, asChild: _asChild, ...rest } = props;
    void _asChild;
    return React.cloneElement(children, {
      ...rest,
      className: cx(resolvedClassName, children.props.className),
    });
  }

  const { asChild: _asChild, ...buttonProps } = props;
  void _asChild;
  return <button className={resolvedClassName} {...buttonProps} />;
}

export { Button };
