const { addonBuilder, serveHTTP } = require("stremio-addon-sdk")

const manifest = {
  id: "org.stremio.erdbultimate",
  version: "3.0.0",
  name: "ERDB Ultimate Posters",
  description: "Poster con rating IMDb, Rotten, Metacritic",
  resources: ["meta"],
  types: ["movie","series"],
  idPrefixes: ["tt"],

  config: [
    { key:"erdbConfig", type:"text", title:"ERDB Config (base64url)" },

    { key:"enablePoster", type:"checkbox", title:"Poster con rating", default:true },
    { key:"enableBackdrop", type:"checkbox", title:"Backdrop con rating", default:true },
    { key:"enableLogo", type:"checkbox", title:"Logo film", default:true }
  ]
}

const builder = new addonBuilder(manifest)

// Funzione per decodificare il config base64
function decodeConfig(erdbConfig){
  if(!erdbConfig) return null
  try{
    return JSON.parse(
      Buffer.from(erdbConfig,"base64url").toString("utf8")
    )
  }catch{
    return null
  }
}

// Funzione per creare URL ERDB
function buildERDBUrl(type,id,cfg){
  const ratingStyle =
    type==="poster"
      ? cfg.posterRatingStyle
      : type==="backdrop"
      ? cfg.backdropRatingStyle
      : cfg.logoRatingStyle

  const imageText =
    type==="backdrop"
      ? cfg.backdropImageText
      : cfg.posterImageText

  const params = new URLSearchParams()

  if(cfg.tmdbKey) params.append("tmdbKey",cfg.tmdbKey)
  if(cfg.mdblistKey) params.append("mdblistKey",cfg.mdblistKey)
  if(cfg.ratings) params.append("ratings",cfg.ratings)
  if(cfg.lang) params.append("lang",cfg.lang)
  if(ratingStyle) params.append("ratingStyle",ratingStyle)

  if(type!=="logo" && imageText)
    params.append("imageText",imageText)

  if(cfg.posterRatingsLayout)
    params.append("posterRatingsLayout",cfg.posterRatingsLayout)

  if(cfg.posterRatingsMaxPerSide)
    params.append("posterRatingsMaxPerSide",cfg.posterRatingsMaxPerSide)

  if(cfg.backdropRatingsLayout)
    params.append("backdropRatingsLayout",cfg.backdropRatingsLayout)

  return `${cfg.baseUrl}/${type}/${id}.jpg?${params.toString()}`
}

// Handler meta per Stremio
builder.defineMetaHandler(async ({ id, config }) => {
  const cfg = decodeConfig(config.erdbConfig)

  const meta = {
    id,
    type: id.startsWith("tt") ? "movie":"series",
    name: id
  }

  if(cfg){
    if(config.enablePoster)
      meta.poster = buildERDBUrl("poster",id,cfg)

    if(config.enableBackdrop)
      meta.background = buildERDBUrl("backdrop",id,cfg)

    if(config.enableLogo)
      meta.logo = buildERDBUrl("logo",id,cfg)
  }

  return { meta }
})

// Avvio server con porta dinamica (Render la assegna automaticamente)
serveHTTP(builder.getInterface(), {
  port: process.env.PORT || 7000
})
