import { IconBase, type IconProps } from './IconBase';

/** Segitiga ke kanan: jalankan simulasi. */
export function PlayIcon(props: IconProps) {
  return (
    <IconBase filled {...props}>
      <path d="M8 5v14l11-7z" />
    </IconBase>
  );
}

/** Dua batang tegak: jeda simulasi. */
export function PauseIcon(props: IconProps) {
  return (
    <IconBase filled {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </IconBase>
  );
}

/** Segitiga dengan batang: maju satu tick. */
export function StepIcon(props: IconProps) {
  return (
    <IconBase filled {...props}>
      <path d="M6 5v14l9-7z" />
      <rect x="17" y="5" width="2.5" height="14" rx="1" />
    </IconBase>
  );
}

/** Panah melingkar: kembali ke awal. */
export function ResetIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12a7 7 0 1 1-2-5" />
      <path d="M17 3.5V7h-3.5" />
    </IconBase>
  );
}

/** Roda gigi sederhana: pengaturan. */
export function GearIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
      <path d="M19.4 4.6l-2.1 2.1M19.4 19.4l-2.1-2.1M4.6 19.4l2.1-2.1M4.6 4.6l2.1 2.1" />
    </IconBase>
  );
}

/** Gembok: level atau modul terkunci. */
export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2.5" />
    </IconBase>
  );
}

/** Tempat sampah: hapus alat atau progres. */
export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 7h14" />
      <path d="M10 7V5h4v2" />
      <path d="M7 7l1 12h8l1-12" />
      <path d="M10.5 10.5v5M13.5 10.5v5" />
    </IconBase>
  );
}

/** Tanda tanya dalam lingkaran: bantuan atau petunjuk. */
export function HelpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9.5C9 7.5 10.5 6.5 12 6.5S15 7.5 15 9.3c0 2-3 2.2-3 4.2" />
      <path d="M12 17.5h.01" />
    </IconBase>
  );
}

/** Tiga garis: membuka menu. */
export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconBase>
  );
}

/** Chevron kiri: kembali. */
export function BackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 5l-7 7 7 7" />
    </IconBase>
  );
}

interface StarIconProps extends IconProps {
  /** True untuk bintang kosong (garis); bawaannya bintang padat. */
  outline?: boolean;
}

/** Bintang lima sudut: penilaian level. */
export function StarIcon({ outline = false, ...props }: StarIconProps) {
  return (
    <IconBase filled={!outline} {...props}>
      <path d="M12 3.5L14.23 9.43L20.56 9.72L15.61 13.67L17.29 19.78L12 16.3L6.71 19.78L8.39 13.67L3.44 9.72L9.77 9.43Z" />
    </IconBase>
  );
}

/** Panah ke kanan; putar dengan kelas CSS bila perlu arah lain. */
export function ArrowIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </IconBase>
  );
}
