interface IAsset {
  /** the type of the asset */
  type: string,

  /** the source path */
  src: string,

  /** mark the asset as scoped */
  scoped: boolean
}

export default IAsset;