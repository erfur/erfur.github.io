import NextImage, { ImageProps } from 'next/image'

const Image = ({ className, ...rest }: ImageProps) => (
  <span className="flex justify-center">
    <NextImage className={className} {...rest} />
  </span>
)

export default Image
