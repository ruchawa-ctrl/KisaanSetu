"""Train and export a MobileNetV3 crop-quality classifier."""
from pathlib import Path
import copy, torch
from PIL import Image
from torch import nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
CLASSES = ['GRADE_A','GRADE_B','GRADE_C']
def build_transforms():
    return transforms.Compose([transforms.Resize((224,224)), transforms.RandomHorizontalFlip(), transforms.RandomRotation(12), transforms.ColorJitter(brightness=.25, contrast=.2, saturation=.2), transforms.ToTensor(), transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
def train(data_dir='data/grading', output='crop_grader.onnx', epochs=12, patience=3):
    device = 'cuda' if torch.cuda.is_available() else 'cpu'; dataset = datasets.ImageFolder(data_dir, transform=build_transforms()); split = int(len(dataset)*.8); train_set, val_set = torch.utils.data.random_split(dataset, [split, len(dataset)-split]); train_loader = DataLoader(train_set, batch_size=32, shuffle=True); val_loader = DataLoader(val_set, batch_size=32); model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT); model.classifier[3] = nn.Linear(model.classifier[3].in_features, 3); model.to(device); optimizer = torch.optim.AdamW(model.parameters(), lr=2e-4); loss_fn = nn.CrossEntropyLoss(); best, stale, best_state = 0, 0, None
    for epoch in range(epochs):
        model.train()
        for images, labels in train_loader: optimizer.zero_grad(); loss_fn(model(images.to(device)), labels.to(device)).backward(); optimizer.step()
        model.eval(); correct = total = 0
        with torch.no_grad():
            for images, labels in val_loader: correct += (model(images.to(device)).argmax(1) == labels.to(device)).sum().item(); total += len(labels)
        accuracy = correct / max(total, 1); print(f'epoch={epoch+1} val_accuracy={accuracy:.3f}')
        if accuracy > best: best, stale, best_state = accuracy, 0, copy.deepcopy(model.state_dict())
        else: stale += 1
        if stale >= patience: break
    model.load_state_dict(best_state); model.cpu(); torch.onnx.export(model, torch.randn(1,3,224,224), output, input_names=['image'], output_names=['logits'], opset_version=17); return model
def infer(image: Image.Image, model):
    tensor = build_transforms()(image.convert('RGB')).unsqueeze(0)
    with torch.no_grad():
        probabilities = torch.softmax(model(tensor), 1)[0]
    index = int(probabilities.argmax())
    return CLASSES[index], float(probabilities[index])
if __name__ == '__main__': train()
