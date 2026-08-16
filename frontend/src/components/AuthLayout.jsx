// export default function AuthLayout({ eyebrow, title, subtitle, children }) {
//   return (
//     <div className="min-h-screen w-full bg-paper font-body">
//       <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center">
//         {/* Form column */}
//         <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
//           <div className="mx-auto w-full max-w-sm">
//             <div className="mb-10 flex items-center gap-2">
//               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper font-display font-bold">
//                 X
//               </div>
//               <span className="font-display text-lg font-bold tracking-tight">
//                 Swipe<span className="text-signal">X</span>
//               </span>
//             </div>

//             {eyebrow && (
//               <p className="mb-2 font-body text-xs font-semibold uppercase tracking-widest text-ink/50">
//                 {eyebrow}
//               </p>
//             )}
//             <h1 className="font-display text-3xl font-bold leading-tight text-ink">
//               {title}
//             </h1>
//             {subtitle && (
//               <p className="mt-3 text-sm leading-relaxed text-ink/60">
//                 {subtitle}
//               </p>
//             )}

//             <div className="mt-8 w-full">{children}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
