# planet-agent

## Jolie Updates - Apr 14

### Knowledge Base Setup

The knowledge base uses 110 Jupyter notebooks from the [Planet Labs notebook repo](https://github.com/planetlabs/notebooks). They are stored flat (no subdirectories) in `knowledge-base/notebooks/` for easy ingestion with LlamaIndex.

#### Running `build_metadata.py`

> **Note:** The setup steps below are only needed if you want to run `build_metadata.py`. The script has already been run and its outputs (`notebooks_metadata.json`, the metadata cells in each `.ipynb`) are committed — you do not need to re-run it unless the notebooks change.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Add your Gemini API key to `.env`:

```
GEMINI_API_KEY=your_key_here
```

Again, this script only needs to be run once (or re-run if notebooks are updated). It:

1. **Derives `use_case`** from the original Planet repo directory structure (hardcoded in `PATH_MAP`)
2. **Detects `planet_product`** via keyword search through all notebook cell content (e.g. `PSScene` → PlanetScope)
3. **Detects `apis_used`** via keyword search through all notebook cell content (e.g. `orders api` → Orders API)
4. **Generates a one-sentence `description`** using Gemini 2.5 Flash
5. **Injects a metadata markdown cell** at the top of each `.ipynb` file
6. **Writes `knowledge-base/data/notebooks_metadata.json`** mapping each filename to its metadata

```bash
.venv/bin/python knowledge-base/build_metadata.py
```

The script saves progress after every notebook — if it crashes, just re-run it and it will resume where it left off.

#### Notes on `apis_used`

20 notebooks have an empty `apis_used` list. These are mostly multi-part series notebooks that work with pre-downloaded data and make no direct API calls — there is no API reference to detect in their content. This is intentional.

| Notebook                                  | Title                                                  |
| ----------------------------------------- | ------------------------------------------------------ |
| `0_download_data.ipynb`                   | —                                                      |
| `1_rasterio_firstlook.ipynb`              | Reading satellite data with rasterio                   |
| `2_drc_roads_classification.ipynb`        | DRC Roads - Classification                             |
| `2_rasterbands.ipynb`                     | Working with Raster Bands                              |
| `3_ard_use_case_1_visualize_images.ipynb` | Analysis Ready Data Tutorial Part 2: Use Case 1        |
| `3_compute_NDWI.ipynb`                    | NDWI & Pixel Classification                            |
| `3_drc_roads_temporal_analysis.ipynb`     | DRC Roads Temporal Analysis                            |
| `3_introduction_to_cogs.ipynb`            | Introduction to Cloud Optimized GeoTIFFs               |
| `3_segment_knn.ipynb`                     | Segmentation: KNN                                      |
| `4_masks_and_filters.ipynb`               | Applying Masks & Filters                               |
| `4_segment_knn_tuning.ipynb`              | KNN Parameter Tuning                                   |
| `5_drc_roads_mosaic.ipynb`                | DRC Change Detection Using Mosaics                     |
| `5_plotting_a_histogram.ipynb`            | Plotting a Histogram                                   |
| `calculate_coverage_wgs84.ipynb`          | Calculate Coverage                                     |
| `coastline_analysis.ipynb`                | Coastline Recession in Bangladesh: A Temporal Analysis |
| `inspecting_satellite_imagery.ipynb`      | Inspecting Satellite Imagery using Rasterio            |
| `mosaicking_and_masking.ipynb`            | Mosaicking and Masking                                 |
| `mosaicking_and_masking_key.ipynb`        | Mosaicking and Masking (Answer Key)                    |
| `visualizing_satellite_imagery.ipynb`     | Visualizing Satellite Imagery with Matplotlib          |
| `yield-forecasting.ipynb`                 | Regional yield forecasting using Planetary Variables   |

---

### TODO

#### 1. Stress test categorization

Audit `notebooks_metadata.json` once generated — check that `use_case`, `planet_product`, and `apis_used` are accurate across a sample of notebooks, particularly for edge cases in the `use_cases/` and `workflows/` categories.

Potential ways of stress testing:

- Replace plain substring matching with regex patterns for more precise matching
- Use a lightweight classifier trained on notebook content
- Then check which is more accurate
