package tools.paperless.app.ui.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import tools.paperless.app.ui.theme.Cream
import tools.paperless.app.ui.theme.Forest
import tools.paperless.app.ui.theme.Ink
import tools.paperless.app.ui.theme.PaperlessThemeValues
import tools.paperless.app.ui.theme.SandLight

@Composable
fun PaperlessTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String = "",
    singleLine: Boolean = true,
    minLines: Int = 1,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        label = label?.let { { androidx.compose.material3.Text(it) } },
        placeholder = { androidx.compose.material3.Text(placeholder) },
        singleLine = singleLine,
        minLines = minLines,
        shape = RoundedCornerShape(PaperlessThemeValues.ButtonCornerRadius.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = Cream,
            unfocusedContainerColor = Cream,
            focusedTextColor = Ink,
            unfocusedTextColor = Ink,
            focusedBorderColor = Forest,
            unfocusedBorderColor = Forest.copy(alpha = 0.2f),
            focusedPlaceholderColor = SandLight,
            unfocusedPlaceholderColor = SandLight,
        ),
    )
}
