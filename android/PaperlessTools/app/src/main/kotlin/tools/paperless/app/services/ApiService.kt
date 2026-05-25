package tools.paperless.app.services

import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST

data class ShortenResponse(
    @SerializedName("shortUrl") val shortUrl: String,
    @SerializedName("code") val code: String,
    @SerializedName("statsUrl") val statsUrl: String,
)

data class ShortenErrorResponse(
    @SerializedName("error") val error: String,
)

data class ShortenRequest(
    @SerializedName("url") val url: String,
)

sealed class ApiServiceError(message: String) : Exception(message) {
    class InvalidUrl : ApiServiceError("Please enter a valid http or https URL.")
    class ServerError(message: String) : ApiServiceError(message)
    class DecodingFailed : ApiServiceError("Could not read the server response.")
}

interface ShortenApi {
    @POST("/api/shorten")
    suspend fun shorten(@Body request: ShortenRequest): ShortenResponse
}

object ApiService {
    const val BASE_URL = "https://paperless.tools"

    private val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val api: ShortenApi = retrofit.create(ShortenApi::class.java)

    suspend fun shortenUrl(urlString: String): ShortenResponse {
        val trimmed = urlString.trim()
        if (trimmed.isEmpty() || !(trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
            throw ApiServiceError.InvalidUrl()
        }

        return try {
            api.shorten(ShortenRequest(trimmed))
        } catch (e: retrofit2.HttpException) {
            val errorBody = e.response()?.errorBody()?.string()
            val message = errorBody?.let {
                runCatching {
                    com.google.gson.Gson().fromJson(it, ShortenErrorResponse::class.java).error
                }.getOrNull()
            } ?: "Could not shorten URL."
            throw ApiServiceError.ServerError(message)
        } catch (e: ApiServiceError) {
            throw e
        } catch (_: Exception) {
            throw ApiServiceError.DecodingFailed()
        }
    }
}
