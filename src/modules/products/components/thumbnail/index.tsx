import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"
import HoverImage from "./hover-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  /** nome do produto → alt descritivo (a11y/SEO) em vez de "Miniatura" */
  title?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  title,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url
  // 2ª imagem p/ o hover = primeira que difere da exibida (robusto a thumbnail==images[0])
  const hoverImage = images?.find((i) => i?.url && i.url !== initialImage)?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden p-2 bg-white shadow-elevation-card-rest rounded-large group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[1/1]": !isFeatured,
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} title={title} />
      {/* só há efeito se existir 2ª imagem (graceful p/ produto de 1 foto) */}
      {hoverImage && <HoverImage src={hoverImage} />}
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  title,
}: Pick<ThumbnailProps, "size" | "title"> & { image?: string }) => {
  return image ? (
    <Image
      src={image}
      alt={title ? `Foto do produto ${title}` : "Foto do produto"}
      className="absolute inset-0 object-contain object-center p-2"
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
