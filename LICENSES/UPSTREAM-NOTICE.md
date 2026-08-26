# 上游项目授权说明

本整合包的可运行代码是为本次整合**独立编写的轻量实现**，没有把三个上游仓库的源文件直接复制进来。

这样处理是有意为之：

- **Earthworm** (`cuixueshe/earthworm`)：仓库使用 GNU AGPL v3。若你直接复制/修改其源代码并作为网络服务运行，需要按 AGPL 的要求处理对应源码提供等义务。
- **Lector** (`heuwels/lector`)：仓库使用 GNU AGPL v3。其 README 也明确说明，修改版作为网络服务提供时，需要向用户提供匹配源码。
- **basic_english** (`mythquan/basic_english`)：检查仓库根目录时没有发现明确的 `LICENSE` 文件，因此本包**没有复制其 JS、HTML、CSS 或词库数据**；只参考公开 README 中描述的产品功能，然后重新实现了本地单词、语法、TTS 和 SRS 能力。

上游地址：

- https://github.com/cuixueshe/earthworm
- https://github.com/mythquan/basic_english
- https://github.com/heuwels/lector

如果未来你决定直接合并上游代码，而不是使用本包的独立实现，请在合并前再次核对各仓库当时的 LICENSE、NOTICE、数据集授权和资源文件授权。
