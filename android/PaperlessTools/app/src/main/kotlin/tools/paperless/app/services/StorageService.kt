package tools.paperless.app.services

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.util.Date
import java.util.UUID

data class SavedSignature(
    val id: String = UUID.randomUUID().toString(),
    val name: String,
    val pngBase64: String,
    val createdAt: Date = Date(),
) {
    fun bitmap(): Bitmap? = runCatching {
        val bytes = Base64.decode(pngBase64, Base64.DEFAULT)
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    }.getOrNull()
}

object StorageService {
    private const val PREFS_NAME = "paperless_signatures"
    private const val KEY_SIGNATURES = "signatures"

    fun loadSignatures(context: Context): List<SavedSignature> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val json = prefs.getString(KEY_SIGNATURES, null) ?: return emptyList()
        return runCatching {
            val array = JSONArray(json)
            buildList {
                for (index in 0 until array.length()) {
                    val item = array.getJSONObject(index)
                    add(
                        SavedSignature(
                            id = item.getString("id"),
                            name = item.getString("name"),
                            pngBase64 = item.getString("pngBase64"),
                            createdAt = Date(item.getLong("createdAt")),
                        ),
                    )
                }
            }
        }.getOrDefault(emptyList())
    }

    fun saveSignature(context: Context, name: String, bitmap: Bitmap) {
        val output = java.io.ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
        val base64 = Base64.encodeToString(output.toByteArray(), Base64.DEFAULT)
        val signatures = loadSignatures(context).toMutableList()
        signatures.add(0, SavedSignature(name = name, pngBase64 = base64))
        persist(context, signatures)
    }

    fun deleteSignature(context: Context, id: String) {
        val signatures = loadSignatures(context).filterNot { it.id == id }
        persist(context, signatures)
    }

    private fun persist(context: Context, signatures: List<SavedSignature>) {
        val array = JSONArray()
        signatures.forEach { signature ->
            array.put(
                JSONObject()
                    .put("id", signature.id)
                    .put("name", signature.name)
                    .put("pngBase64", signature.pngBase64)
                    .put("createdAt", signature.createdAt.time),
            )
        }
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_SIGNATURES, array.toString())
            .apply()
    }
}
