"use client";

// This component uses custom keyframe animations defined in app/globals.css
// to ensure perfect compatibility with React Server Components (RSC).
export const Component = () => {
  return (
    <div className="relative w-[65px] aspect-square">
      <span className="absolute rounded-[50px] animate-loaderAnim shadow-[inset_0_0_0_3px] shadow-cobalt dark:shadow-cobalt" />
      <span className="absolute rounded-[50px] animate-loaderAnim animation-delay shadow-[inset_0_0_0_3px] shadow-cobalt dark:shadow-cobalt" />
    </div>
  );
};
